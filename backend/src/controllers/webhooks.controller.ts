import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import * as stripeService from '../services/stripe.service'
import * as mercadopagoService from '../services/mercadopago.service'

/**
 * Stripe webhook handler
 */
export async function stripeWebhook(req: Request, res: Response) {
  try {
    const signature = req.headers['stripe-signature'] as string

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' })
    }

    // Verify webhook signature
    const event = await stripeService.verifyWebhookSignature(
      req.body,
      signature
    )

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as any

        // Find appointment by payment intent ID
        const appointment = await prisma.appointment.findFirst({
          where: {
            paymentIntentId: paymentIntent.id as any,
            paymentProvider: 'STRIPE' as any,
          } as any,
        })

        if (appointment) {
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: {
              paymentStatus: 'PAID',
            },
          })
          console.log(
            `✅ Payment confirmed for appointment ${appointment.id}`
          )
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as any

        const appointment = await prisma.appointment.findFirst({
          where: {
            paymentIntentId: paymentIntent.id as any,
            paymentProvider: 'STRIPE' as any,
          } as any,
        })

        if (appointment) {
          console.log(
            `❌ Payment failed for appointment ${appointment.id}`
          )
          // Optionally update appointment status or send notification
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as any

        const appointment = await prisma.appointment.findFirst({
          where: {
            paymentIntentId: charge.payment_intent as any,
            paymentProvider: 'STRIPE' as any,
          } as any,
        })

        if (appointment) {
          const refundAmount = charge.amount_refunded / 100
          const aptPaymentAmount = (appointment as any).paymentAmount || 0

          await prisma.appointment.update({
            where: { id: appointment.id },
            data: {
              paymentStatus:
                refundAmount >= aptPaymentAmount
                  ? 'REFUNDED'
                  : 'PARTIALLY_REFUNDED',
              refundAmount: refundAmount as any,
            } as any,
          })
          console.log(
            `💰 Refund processed for appointment ${appointment.id}: $${refundAmount}`
          )
        }
        break
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`)
    }

    // Return 200 to acknowledge receipt
    return res.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return res.status(400).json({ error: 'Webhook error' })
  }
}

/**
 * Mercado Pago webhook handler (IPN)
 */
export async function mercadopagoWebhook(req: Request, res: Response) {
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
      const payment = await mercadopagoService.getPayment(paymentId)

      // Find appointment by preference ID (stored in paymentIntentId)
      const preferenceId = payment.metadata?.preference_id || payment.external_reference

      const appointment = await prisma.appointment.findFirst({
        where: {
          paymentIntentId: preferenceId as any,
          paymentProvider: 'MERCADOPAGO' as any,
        } as any,
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
        const aptPaymentAmount = (appointment as any).paymentAmount || 0

        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            paymentStatus:
              refundAmount >= aptPaymentAmount
                ? 'REFUNDED'
                : 'PARTIALLY_REFUNDED',
            refundAmount: refundAmount as any,
          } as any,
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
