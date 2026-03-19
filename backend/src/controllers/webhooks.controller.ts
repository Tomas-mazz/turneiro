import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import * as mercadopagoService from '../services/mercadopago.service'

type MercadoPagoPaymentLike = {
  metadata?: { preference_id?: string }
  external_reference?: string
  status?: string
  transaction_amount?: number
}

/**
 * Mercado Pago webhook handler (IPN).
 * Set MERCADOPAGO_WEBHOOK_ENABLED=true to enable.
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

      // Get payment details from Mercado Pago
      const payment = await mercadopagoService.getPayment(paymentId) as MercadoPagoPaymentLike

      // Find appointment by preference ID (stored in paymentIntentId)
      const preferenceId = payment.metadata?.preference_id || payment.external_reference

      const appointment = await prisma.appointment.findFirst({
        where: {
          paymentIntentId: preferenceId,
          paymentProvider: 'MERCADOPAGO',
        },
      })

      if (!appointment) {
        console.log(`No appointment found for Mercado Pago payment ${paymentId}`)
        return res.json({ received: true })
      }

      // Update appointment based on payment status
      if (payment.status === 'approved') {
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            paymentStatus: 'PAID',
          },
        })
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
