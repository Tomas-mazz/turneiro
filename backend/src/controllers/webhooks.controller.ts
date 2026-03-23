import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import * as mercadopagoService from '../services/mercadopago.service'
import { finalizeAppointmentAfterPaymentService } from '../services/appointments.service'

type MercadoPagoPaymentLike = {
  metadata?: { preference_id?: string }
  external_reference?: string
  status?: string
  transaction_amount?: number
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
    const { type, data } = req.body

    // Get headers for signature verification
    const xSignature = req.headers['x-signature'] as string
    const xRequestId = req.headers['x-request-id'] as string

    // Verify webhook (basic verification for now)
    const isValid = await mercadopagoService.verifyWebhookSignature(
      xSignature,
      xRequestId,
      data?.id
    )

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' })
    }

    // Handle different notification types
    if (type === 'payment') {
      const paymentId = data.id

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

      // Find appointment by preference ID (stored in paymentIntentId)
      const preferenceId = payment.metadata?.preference_id || payment.external_reference

      const appointment = await prisma.appointment.findFirst({
        where: {
          paymentIntentId: preferenceId,
          paymentProvider: 'MERCADOPAGO',
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
