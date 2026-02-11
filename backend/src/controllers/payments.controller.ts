import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import * as stripeService from '../services/stripe.service'
import * as mercadopagoService from '../services/mercadopago.service'

/**
 * Create payment intent (Stripe) or preference (Mercado Pago)
 */
export async function createPaymentIntent(req: Request, res: Response) {
  try {
    const { appointmentId, provider } = req.body

    if (!appointmentId || !provider) {
      return res.status(400).json({
        error: 'appointmentId y provider son requeridos',
      })
    }

    if (!['STRIPE', 'MERCADOPAGO'].includes(provider)) {
      return res.status(400).json({
        error: 'Provider debe ser STRIPE o MERCADOPAGO',
      })
    }

    // Get appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        business: {
          include: {
            settings: true,
          },
        },
        service: true,
      },
    })

    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' })
    }

    if (appointment.paymentStatus === 'PAID') {
      return res.status(400).json({ error: 'Esta cita ya está pagada' })
    }

    // Get business settings
    const settings = appointment.business.settings

    if (!settings) {
      return res.status(400).json({
        error: 'Configuración de pago no encontrada para este negocio',
      })
    }

    // Calculate payment amount based on settings
    let paymentAmount = appointment.price

    if (settings.paymentType === 'PERCENTAGE' && settings.depositPercentage) {
      paymentAmount = appointment.price * (settings.depositPercentage / 100)
    }

    // Round to 2 decimals
    paymentAmount = Math.round(paymentAmount * 100) / 100

    const metadata = {
      appointmentId: appointment.id,
      businessId: appointment.businessId,
      clientName: appointment.clientName,
      clientPhone: appointment.clientPhone,
    }

    if (provider === 'STRIPE') {
      const { clientSecret, paymentIntentId } =
        await stripeService.createPaymentIntent(
          paymentAmount,
          'usd', // Default currency, can be made configurable
          metadata
        )

      // Update appointment with payment info
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          paymentProvider: 'STRIPE',
          paymentIntentId,
          paymentAmount,
        },
      })

      return res.json({
        clientSecret,
        paymentIntentId,
        amount: paymentAmount,
        provider: 'STRIPE',
      })
    } else if (provider === 'MERCADOPAGO') {
      const { preferenceId, initPoint } =
        await mercadopagoService.createPreference(
          paymentAmount,
          `${appointment.serviceName} - ${appointment.business.name}`,
          metadata
        )

      // Update appointment with payment info
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          paymentProvider: 'MERCADOPAGO',
          paymentIntentId: preferenceId,
          paymentAmount,
        },
      })

      return res.json({
        preferenceId,
        initPoint,
        amount: paymentAmount,
        provider: 'MERCADOPAGO',
      })
    }
  } catch (error) {
    console.error('createPaymentIntent error:', error)
    return res.status(500).json({ error: 'Error al crear intención de pago' })
  }
}

/**
 * Confirm payment completion (called after successful payment)
 */
export async function confirmPayment(req: Request, res: Response) {
  try {
    const { appointmentId, paymentIntentId } = req.body

    if (!appointmentId || !paymentIntentId) {
      return res.status(400).json({
        error: 'appointmentId y paymentIntentId son requeridos',
      })
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    })

    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' })
    }

    const aptPaymentIntentId = appointment.paymentIntentId
    const aptPaymentProvider = appointment.paymentProvider

    if (aptPaymentIntentId !== paymentIntentId) {
      return res.status(400).json({ error: 'Payment Intent ID no coincide' })
    }

    // Verify payment status with provider
    let paymentVerified = false

    if (aptPaymentProvider === 'STRIPE') {
      const paymentIntent = await stripeService.getPaymentIntent(
        paymentIntentId
      )
      paymentVerified = paymentIntent.status === 'succeeded'
    } else if (aptPaymentProvider === 'MERCADOPAGO') {
      // For Mercado Pago, we rely on webhooks for confirmation
      // This endpoint is more for client-side confirmation UI
      paymentVerified = true
    }

    if (!paymentVerified) {
      return res.status(400).json({ error: 'Pago no verificado' })
    }

    // Update appointment status
    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        paymentStatus: 'PAID',
      },
    })

    return res.json({
      success: true,
      appointment: updated,
    })
  } catch (error) {
    console.error('confirmPayment error:', error)
    return res.status(500).json({ error: 'Error al confirmar pago' })
  }
}
