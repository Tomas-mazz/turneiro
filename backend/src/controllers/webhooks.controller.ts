import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import * as mercadopagoService from '../services/mercadopago.service'
import { listValidMercadoPagoAccessTokens } from '../services/mercadopago-oauth.service'
import { finalizeAppointmentAfterPaymentService } from '../services/appointments.service'

type MercadoPagoPaymentLike = {
  status?: string
  transaction_amount?: number
  metadata?: Record<string, unknown>
  external_reference?: string
  externalReference?: string
  preference_id?: string | number
  preferenceId?: string | number
}

function metaString(meta: Record<string, unknown> | undefined, key: string): string | undefined {
  if (!meta || typeof meta !== 'object') return undefined
  const v = meta[key]
  return v != null ? String(v) : undefined
}

/**
 * Resolve DB appointment from Mercado Pago Payment API shape (metadata + external_reference vary by API version).
 */
async function findAppointmentForMercadoPagoWebhookPayment(
  payment: MercadoPagoPaymentLike
) {
  const meta =
    payment.metadata && typeof payment.metadata === 'object'
      ? (payment.metadata as Record<string, unknown>)
      : undefined

  const preferenceFromMeta =
    metaString(meta, 'preference_id') ?? metaString(meta, 'preferenceId')
  const topPreference =
    payment.preference_id != null
      ? String(payment.preference_id)
      : payment.preferenceId != null
        ? String(payment.preferenceId)
        : undefined
  const preferenceKey = preferenceFromMeta ?? topPreference

  const appointmentIdFromMeta =
    metaString(meta, 'appointment_id') ?? metaString(meta, 'appointmentId')

  const ext =
    payment.external_reference != null
      ? String(payment.external_reference)
      : payment.externalReference != null
        ? String(payment.externalReference)
        : undefined

  const include = {
    business: {
      include: { settings: true },
    },
  } as const

  // 1) Stored MP preference id (Checkout Pro)
  if (preferenceKey) {
    const byPref = await prisma.appointment.findFirst({
      where: {
        paymentIntentId: preferenceKey,
        paymentProvider: 'MERCADOPAGO',
      },
      include,
    })
    if (byPref) return byPref
  }

  // 2) external_reference / metadata sometimes equals preference id only in older flows
  if (ext && ext !== appointmentIdFromMeta) {
    const byExtAsPref = await prisma.appointment.findFirst({
      where: {
        paymentIntentId: ext,
        paymentProvider: 'MERCADOPAGO',
      },
      include,
    })
    if (byExtAsPref) return byExtAsPref
  }

  // 3) Our preference sets external_reference = appointmentId; MP copies metadata.appointmentId on the payment
  const appointmentId = appointmentIdFromMeta ?? ext
  if (appointmentId) {
    const byId = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        paymentProvider: 'MERCADOPAGO',
      },
      include,
    })
    if (byId) return byId
  }

  return null
}

/**
 * Mercado Pago webhook handler (IPN).
 * Disabled until HMAC verification is implemented. Set MERCADOPAGO_WEBHOOK_ENABLED=true to enable.
 */
export async function mercadopagoWebhook(req: Request, res: Response) {
  if (process.env.MERCADOPAGO_WEBHOOK_ENABLED !== 'true') {
    return res.status(501).json({ error: 'Webhook de Mercado Pago no implementado' })
  }
  try {
    const body =
      req.body != null && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {}
    const typeRaw = body.type as string | undefined
    const topic = typeof req.query.topic === 'string' ? req.query.topic : undefined
    const dataObj = (body.data as { id?: string | number } | undefined) ?? {}
    const dataIdFromQuery =
      typeof req.query.id === 'string'
        ? req.query.id
        : Array.isArray(req.query.id)
          ? req.query.id[0]
          : undefined
    const paymentIdForVerify =
      dataObj.id != null ? String(dataObj.id) : dataIdFromQuery != null ? String(dataIdFromQuery) : undefined

    // Signature verification. This runs before anything else touches the DB or Mercado Pago:
    // the endpoint is public, so an unverified notification must cost us nothing.
    const xSignature = req.headers['x-signature'] as string | undefined
    const xRequestId = req.headers['x-request-id'] as string | undefined

    const signingSecrets = await mercadopagoService.listWebhookSigningSecrets()
    const isValid = await mercadopagoService.verifyWebhookSignature(
      xSignature,
      xRequestId,
      paymentIdForVerify,
      signingSecrets
    )

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' })
    }

    // JSON: type "payment". Legacy query IPN: topic "payment" with id = payment id.
    const isPaymentTopic =
      typeRaw === 'payment' ||
      (typeof typeRaw === 'string' && typeRaw.startsWith('payment.')) ||
      topic === 'payment'

    // Handle payment notifications (skip merchant_order etc. until handled explicitly)
    if (isPaymentTopic) {
      const paymentId = paymentIdForVerify
      if (!paymentId) {
        console.warn('Mercado Pago webhook: notificación de pago sin id', {
          topic,
          type: typeRaw,
          bodyKeys: Object.keys(body),
        })
        return res.json({ received: true, ignored: 'missing_payment_id' })
      }

      const candidateTokens = await listValidMercadoPagoAccessTokens()

      let payment: MercadoPagoPaymentLike | null = null
      for (const token of candidateTokens) {
        try {
          payment = await mercadopagoService.getPayment(paymentId, {
            accessToken: token,
          }) as MercadoPagoPaymentLike
          break
        } catch {
          // Continue trying with next token (multi-tenant credentials).
        }
      }
      if (!payment) {
        console.log(`No Mercado Pago credential could resolve payment ${paymentId}`)
        return res.json({ received: true })
      }

      const appointment = await findAppointmentForMercadoPagoWebhookPayment(payment)

      if (!appointment) {
        console.log(
          `No appointment found for Mercado Pago payment ${paymentId} (check metadata / external_reference / preference_id)`
        )
        return res.json({ received: true })
      }
      const appointmentHoldExpiresAt =
        (appointment as unknown as { paymentHoldExpiresAt?: Date | null })
          .paymentHoldExpiresAt ?? null

      // Update appointment based on payment status
      if (payment.status === 'approved') {
        if (appointmentHoldExpiresAt && appointmentHoldExpiresAt.getTime() <= Date.now()) {
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { status: 'CANCELLED' },
          })
          console.log(`⌛ Payment arrived after hold expiry for appointment ${appointment.id}`)
          return res.json({ received: true, expired: true })
        }
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            paymentStatus: 'PAID',
            paymentHoldExpiresAt: null,
          },
        })
        await finalizeAppointmentAfterPaymentService(appointment.id)
        console.log(`✅ Mercado Pago payment approved for appointment ${appointment.id}`)
      } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
        console.log(`❌ Mercado Pago payment ${payment.status} for appointment ${appointment.id}`)
      } else if (payment.status === 'refunded') {
        const refundAmount = payment.transaction_amount || 0
        const aptPaymentAmount = appointment.paymentAmount || 0

        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            paymentStatus:
              refundAmount >= aptPaymentAmount
                ? 'REFUNDED'
                : 'PARTIALLY_REFUNDED',
            refundAmount,
          },
        })
        console.log(`💰 Mercado Pago refund for appointment ${appointment.id}: $${refundAmount}`)
      }
    }

    // Return 200 to acknowledge receipt
    return res.json({ received: true })
  } catch (error) {
    console.error('Mercado Pago webhook error:', error)
    return res.status(400).json({ error: 'Webhook error' })
  }
}
