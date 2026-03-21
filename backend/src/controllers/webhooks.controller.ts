import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import * as mercadopagoService from '../services/mercadopago.service'
import { finalizeAppointmentAfterPaymentService } from '../services/appointments.service'

type MercadoPagoPaymentLike = {
  metadata?: { preference_id?: string | null }
  external_reference?: string | null
  preference_id?: string | null
  status?: string
  transaction_amount?: number
}

function preferenceIdFromMercadoPagoPayment(payment: MercadoPagoPaymentLike): string | null {
  const fromMeta = payment.metadata?.preference_id
  if (fromMeta != null && String(fromMeta).trim() !== '') return String(fromMeta).trim()
  const top = payment.preference_id
  if (top != null && String(top).trim() !== '') return String(top).trim()
  return null
}

async function loadWebhookSecrets(): Promise<string[]> {
  const rows = await prisma.businessSettings.findMany({
    where: { mercadoPagoWebhookSecret: { not: null } },
    select: { mercadoPagoWebhookSecret: true },
  })
  const fromDb = rows
    .map((r) => r.mercadoPagoWebhookSecret)
    .filter((s): s is string => !!s && s.trim().length > 0)
  const env = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim()
  return Array.from(new Set([...(env ? [env] : []), ...fromDb]))
}

function extractWebhookDataId(req: Request): string {
  const q = req.query as Record<string, string | string[] | undefined>
  const fromQuery = q['data.id']
  const qVal =
    typeof fromQuery === 'string'
      ? fromQuery
      : Array.isArray(fromQuery)
        ? fromQuery[0]
        : undefined
  if (qVal && String(qVal).trim() !== '') return String(qVal).trim()
  const body = req.body as { data?: { id?: string | number } } | undefined
  const fromBody = body?.data?.id
  if (fromBody != null && String(fromBody).trim() !== '') return String(fromBody).trim()
  return ''
}

/**
 * Mercado Pago webhook handler (IPN).
 * Set MERCADOPAGO_WEBHOOK_ENABLED=true and configure MERCADOPAGO_WEBHOOK_SECRET (or per-business secret in settings).
 */
export async function mercadopagoWebhook(req: Request, res: Response) {
  if (process.env.MERCADOPAGO_WEBHOOK_ENABLED !== 'true') {
    return res.status(501).json({ error: 'Webhook de Mercado Pago no implementado' })
  }
  try {
    const secrets = await loadWebhookSecrets()
    if (secrets.length === 0) {
      console.warn(
        'Mercado Pago webhook: no MERCADOPAGO_WEBHOOK_SECRET nor business mercadoPagoWebhookSecret configured'
      )
      return res.status(503).json({ error: 'Webhook secret no configurado' })
    }

    const { type, data } = req.body as { type?: string; data?: { id?: string } }

    const xSignature = req.headers['x-signature'] as string | undefined
    const xRequestId = req.headers['x-request-id'] as string | undefined
    const dataId = extractWebhookDataId(req) || String(data?.id ?? '')

    const valid = mercadopagoService.verifyMercadoPagoWebhookSignature(
      xSignature,
      xRequestId,
      dataId,
      secrets
    )
    if (!valid) {
      return res.status(401).json({ error: 'Invalid signature' })
    }

    if (type === 'payment') {
      const paymentId = data?.id
      if (paymentId == null || String(paymentId).trim() === '') {
        return res.json({ received: true })
      }

      const tokenRows = await prisma.businessSettings.findMany({
        where: { mercadoPagoAccessToken: { not: null } },
        select: { mercadoPagoAccessToken: true },
      })
      const candidateTokens = Array.from(
        new Set(
          [
            process.env.MERCADOPAGO_ACCESS_TOKEN ?? null,
            ...tokenRows.map((r) => r.mercadoPagoAccessToken),
          ].filter((t): t is string => !!t && t.trim().length > 0)
        )
      )

      let payment: MercadoPagoPaymentLike | null = null
      for (const token of candidateTokens) {
        try {
          payment = (await mercadopagoService.getPayment(String(paymentId), {
            accessToken: token,
          })) as MercadoPagoPaymentLike
          break
        } catch {
          // Continue trying with next token (multi-tenant credentials).
        }
      }
      if (!payment) {
        console.log(`No Mercado Pago credential could resolve payment ${paymentId}`)
        return res.json({ received: true })
      }

      const prefId = preferenceIdFromMercadoPagoPayment(payment)
      const extRef = payment.external_reference != null ? String(payment.external_reference).trim() : ''

      const orClause: Array<{ paymentIntentId: string } | { id: string }> = []
      if (prefId) orClause.push({ paymentIntentId: prefId })
      if (extRef) orClause.push({ id: extRef })
      if (orClause.length === 0) {
        console.log(`Mercado Pago payment ${paymentId} has no preference id or external_reference`)
        return res.json({ received: true })
      }

      const appointment = await prisma.appointment.findFirst({
        where: {
          paymentProvider: 'MERCADOPAGO',
          OR: orClause,
        },
        include: {
          business: {
            include: { settings: true },
          },
        },
      })

      if (!appointment) {
        console.log(`No appointment found for Mercado Pago payment ${paymentId}`)
        return res.json({ received: true })
      }
      const appointmentHoldExpiresAt =
        (appointment as unknown as { paymentHoldExpiresAt?: Date | null }).paymentHoldExpiresAt ?? null

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
              refundAmount >= aptPaymentAmount ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
            refundAmount,
          },
        })
        console.log(`💰 Mercado Pago refund for appointment ${appointment.id}: $${refundAmount}`)
      }
    }

    return res.json({ received: true })
  } catch (error) {
    console.error('Mercado Pago webhook error:', error)
    return res.status(400).json({ error: 'Webhook error' })
  }
}
