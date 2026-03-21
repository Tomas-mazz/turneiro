import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import * as mercadopagoService from '../services/mercadopago.service'
import { finalizeAppointmentAfterPaymentService } from '../services/appointments.service'

/**
 * Create payment preference (Mercado Pago)
 */
export async function createPaymentIntent(req: Request, res: Response) {
  try {
    const { appointmentId, provider, returnOrigin } = req.body as {
      appointmentId?: string
      provider?: string
      /** Browser origin (e.g. https://foo.com) so MP back_urls match sessionStorage */
      returnOrigin?: string | null
    }

    if (!appointmentId || !provider) {
      return res.status(400).json({
        error: 'appointmentId y provider son requeridos',
      })
    }

    if (provider !== 'MERCADOPAGO') {
      return res.status(400).json({
        error: 'Provider debe ser MERCADOPAGO',
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
    if (
      appointment.paymentStatus === 'PENDING' &&
      appointment.paymentHoldExpiresAt &&
      appointment.paymentHoldExpiresAt.getTime() <= Date.now()
    ) {
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: 'CANCELLED' },
      })
      return res.status(410).json({ error: 'La reserva de pago expiró. Debes reservar nuevamente.' })
    }

    // Get business settings
    const settings = appointment.business.settings

    if (!settings) {
      return res.status(400).json({
        error: 'Configuración de pago no encontrada para este negocio',
      })
    }
    if (!settings.mercadoPagoAccessToken) {
      return res.status(400).json({
        error: 'Este negocio no configuró Mercado Pago todavía',
      })
    }

    // Calculate payment amount based on settings
    let paymentAmount = appointment.price

    if (
      settings.paymentRequired &&
      settings.paymentType === 'PERCENTAGE' &&
      settings.depositPercentage
    ) {
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

    const { preferenceId, initPoint } =
      await mercadopagoService.createPreference(
        paymentAmount,
        `${appointment.serviceName} - ${appointment.business.name}`,
        metadata,
        {
          accessToken: settings.mercadoPagoAccessToken,
          returnOrigin: typeof returnOrigin === 'string' ? returnOrigin : null,
        }
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
  } catch (error) {
    console.error('createPaymentIntent error:', error)
    return res.status(500).json({ error: 'Error al crear intención de pago' })
  }
}

/**
 * Confirm payment completion (called after successful payment)
 */
type MercadoPagoPaymentResource = {
  status?: string
  metadata?: { preference_id?: string | null } | null
  external_reference?: string | null
  preference_id?: string | null
}

function preferenceIdFromMercadoPagoPayment(payment: MercadoPagoPaymentResource): string | null {
  const fromMeta = payment.metadata?.preference_id
  if (fromMeta != null && String(fromMeta).trim() !== '') return String(fromMeta).trim()
  const top = payment.preference_id
  if (top != null && String(top).trim() !== '') return String(top).trim()
  return null
}

export async function confirmPayment(req: Request, res: Response) {
  try {
    const { appointmentId, paymentIntentId, mercadoPagoPaymentId } = req.body as {
      appointmentId?: string
      paymentIntentId?: string
      mercadoPagoPaymentId?: string | null
    }

    if (!appointmentId || !paymentIntentId) {
      return res.status(400).json({
        error: 'appointmentId y paymentIntentId son requeridos',
      })
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { business: { include: { settings: true } } },
    })

    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' })
    }

    if (appointment.paymentStatus === 'PAID') {
      return res.json({
        success: true,
        alreadyPaid: true,
        providerStatus: 'approved',
        appointment,
      })
    }

    const aptPaymentIntentId = appointment.paymentIntentId
    const aptPaymentProvider = appointment.paymentProvider
    if (
      appointment.paymentStatus === 'PENDING' &&
      appointment.paymentHoldExpiresAt &&
      appointment.paymentHoldExpiresAt.getTime() <= Date.now()
    ) {
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: 'CANCELLED' },
      })
      return res.status(410).json({ error: 'La reserva de pago expiró. Debes reservar nuevamente.' })
    }

    if (aptPaymentIntentId !== paymentIntentId) {
      return res.status(400).json({ error: 'Payment Intent ID no coincide' })
    }

    const accessToken = appointment.business.settings?.mercadoPagoAccessToken

    let paymentVerified = false
    let paymentStatus: string | undefined
    if (aptPaymentProvider === 'MERCADOPAGO') {
      const mpPaymentIdRaw =
        mercadoPagoPaymentId != null && String(mercadoPagoPaymentId).trim() !== ''
          ? String(mercadoPagoPaymentId).trim()
          : null

      // Direct payment id (numeric) stored as paymentIntentId (unusual for our flow)
      if (/^\d+$/.test(String(paymentIntentId)) && !mpPaymentIdRaw) {
        const payment = (await mercadopagoService.getPayment(String(paymentIntentId), {
          accessToken,
        })) as MercadoPagoPaymentResource
        paymentStatus = payment.status
        paymentVerified = paymentStatus === 'approved'
      } else if (mpPaymentIdRaw && /^\d+$/.test(mpPaymentIdRaw)) {
        // Checkout Pro redirect: client sends Mercado Pago payment id from success URL (?payment_id=...)
        const payment = (await mercadopagoService.getPayment(mpPaymentIdRaw, {
          accessToken,
        })) as MercadoPagoPaymentResource
        paymentStatus = payment.status
        const prefFromPayment = preferenceIdFromMercadoPagoPayment(payment)
        const extRef = payment.external_reference
        const matchesPreference =
          prefFromPayment != null && String(prefFromPayment) === String(aptPaymentIntentId)
        const matchesAppointment =
          extRef != null && String(extRef) === String(appointmentId)
        paymentVerified =
          paymentStatus === 'approved' && (matchesPreference || matchesAppointment)
      } else {
        return res.status(400).json({
          error:
            'Falta el ID de pago de Mercado Pago. Volvé desde la pantalla de pago o esperá unos minutos y revisá tu correo.',
        })
      }
    }

    if (!paymentVerified) {
      return res.status(400).json({ error: 'Pago no verificado' })
    }

    // Update appointment status
    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        paymentStatus: 'PAID',
        paymentHoldExpiresAt: null,
      },
    })
    await finalizeAppointmentAfterPaymentService(updated.id)

    return res.json({
      success: true,
      providerStatus: paymentStatus ?? null,
      appointment: updated,
    })
  } catch (error) {
    console.error('confirmPayment error:', error)
    return res.status(500).json({ error: 'Error al confirmar pago' })
  }
}

export async function cancelPendingPayment(req: Request, res: Response) {
  try {
    const { appointmentId } = req.body ?? {}
    if (!appointmentId) {
      return res.status(400).json({ error: 'appointmentId es requerido' })
    }
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        paymentStatus: true,
        status: true,
      },
    })
    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' })
    }
    if (appointment.paymentStatus === 'PAID') {
      return res.status(400).json({ error: 'La cita ya fue pagada' })
    }
    if (appointment.status === 'CANCELLED') {
      return res.json({ cancelled: true, alreadyCancelled: true })
    }

    await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: 'CANCELLED',
        paymentHoldExpiresAt: null,
      },
    })
    return res.json({ cancelled: true })
  } catch (error) {
    console.error('cancelPendingPayment error:', error)
    return res.status(500).json({ error: 'Error al cancelar reserva pendiente de pago' })
  }
}
