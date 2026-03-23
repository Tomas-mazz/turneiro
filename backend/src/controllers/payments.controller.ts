import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import * as mercadopagoService from '../services/mercadopago.service'
import { finalizeAppointmentAfterPaymentService } from '../services/appointments.service'

type MercadoPagoPaymentLike = {
  status?: string
  metadata?: Record<string, unknown>
  external_reference?: string
  externalReference?: string
  preference_id?: string | number
  preferenceId?: string | number
}

type BookingSummaryPayload = {
  appointmentId: string
  businessSlug: string
  primaryColor: string
  serviceName: string
  startTime: string
  endTime: string
  cancellationToken: string | null
}

function toBookingSummary(apt: {
  id: string
  serviceName: string
  startTime: Date
  endTime: Date
  cancellationToken: string | null
  business: { slug: string; primaryColor: string }
}): BookingSummaryPayload {
  return {
    appointmentId: apt.id,
    businessSlug: apt.business.slug,
    primaryColor: apt.business.primaryColor,
    serviceName: apt.serviceName,
    startTime: apt.startTime.toISOString(),
    endTime: apt.endTime.toISOString(),
    cancellationToken: apt.cancellationToken,
  }
}

/** Ensure an approved MP payment is for this appointment (preference / metadata / external_reference). */
function mercadoPagoPaymentBelongsToAppointment(
  payment: MercadoPagoPaymentLike,
  appointmentId: string,
  storedPreferenceId: string | null
): boolean {
  const meta = payment.metadata
  const m = (key: string): string | undefined => {
    if (!meta || typeof meta !== 'object') return undefined
    const v = meta[key]
    return v != null ? String(v) : undefined
  }
  if (m('appointment_id') === appointmentId || m('appointmentId') === appointmentId) return true
  const prefMeta = m('preference_id') ?? m('preferenceId')
  if (storedPreferenceId && prefMeta && prefMeta === String(storedPreferenceId)) return true
  const topPref = payment.preference_id ?? payment.preferenceId
  if (storedPreferenceId && topPref != null && String(topPref) === String(storedPreferenceId)) return true
  const ext = payment.external_reference ?? payment.externalReference
  if (ext != null && String(ext) === appointmentId) return true
  return false
}

/**
 * Create payment preference (Mercado Pago)
 */
export async function createPaymentIntent(req: Request, res: Response) {
  try {
    const { appointmentId, provider } = req.body

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
        { accessToken: settings.mercadoPagoAccessToken }
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
export async function confirmPayment(req: Request, res: Response) {
  try {
    const { appointmentId, paymentIntentId: bodyPaymentIntentId, mercadoPagoPaymentId: rawMpPaymentId } =
      req.body ?? {}

    const clientSentPreferenceId =
      bodyPaymentIntentId != null && String(bodyPaymentIntentId).trim() !== ''

    if (!appointmentId) {
      return res.status(400).json({
        error: 'appointmentId es requerido',
      })
    }

    const mercadoPagoPaymentId =
      rawMpPaymentId != null && String(rawMpPaymentId).trim() !== ''
        ? String(rawMpPaymentId).trim()
        : undefined

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        business: {
          select: { slug: true, primaryColor: true },
        },
      },
    })

    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' })
    }

    // Already PAID (e.g. webhook): still run finalize so emails/calendar enqueue now if they never ran.
    if (appointment.paymentStatus === 'PAID') {
      await finalizeAppointmentAfterPaymentService(appointment.id)
      return res.json({
        success: true,
        alreadyConfirmed: true,
        booking: toBookingSummary(appointment),
        providerStatus: 'approved',
      })
    }

    const aptPaymentIntentId = appointment.paymentIntentId
    const aptPaymentProvider = appointment.paymentProvider
    const resolvedPaymentIntentId =
      bodyPaymentIntentId != null && String(bodyPaymentIntentId).trim() !== ''
        ? String(bodyPaymentIntentId).trim()
        : aptPaymentIntentId

    if (!resolvedPaymentIntentId) {
      return res.status(400).json({
        error: 'La cita no tiene una preferencia de pago asociada',
      })
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

    if (aptPaymentIntentId && aptPaymentIntentId !== resolvedPaymentIntentId) {
      return res.status(400).json({ error: 'Payment Intent ID no coincide' })
    }

    const withSettings = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { business: { include: { settings: true } } },
    })
    const accessToken = withSettings?.business.settings?.mercadoPagoAccessToken

    let paymentVerified = false
    let paymentStatus: string | undefined

    if (aptPaymentProvider === 'MERCADOPAGO') {
      if (mercadoPagoPaymentId && /^\d+$/.test(mercadoPagoPaymentId)) {
        const payment = (await mercadopagoService.getPayment(mercadoPagoPaymentId, {
          accessToken,
        })) as MercadoPagoPaymentLike
        paymentStatus = payment.status
        paymentVerified =
          paymentStatus === 'approved' &&
          mercadoPagoPaymentBelongsToAppointment(payment, appointmentId, aptPaymentIntentId)
        if (paymentStatus === 'approved' && !paymentVerified) {
          return res.status(400).json({ error: 'El pago no corresponde a esta reserva' })
        }
      } else if (/^\d+$/.test(String(resolvedPaymentIntentId))) {
        const payment = (await mercadopagoService.getPayment(String(resolvedPaymentIntentId), {
          accessToken,
        })) as MercadoPagoPaymentLike
        paymentStatus = payment.status
        paymentVerified = paymentStatus === 'approved'
      } else if (clientSentPreferenceId && aptPaymentIntentId === resolvedPaymentIntentId) {
        // Misma pestaña / sessionStorage: el cliente reenvía el preferenceId que guardó al ir a MP.
        paymentVerified = true
      } else {
        return res.status(400).json({
          error:
            'No pudimos confirmar el pago automáticamente. Si ya pagaste, esperá unos segundos y recargá la página, o volvé a abrir el enlace desde el mismo sitio donde hiciste la reserva (mismo dominio con/sin www).',
        })
      }
    }

    if (!paymentVerified) {
      return res.status(400).json({ error: 'Pago no verificado' })
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        paymentStatus: 'PAID',
        paymentHoldExpiresAt: null,
      },
      include: {
        business: {
          select: { slug: true, primaryColor: true },
        },
      },
    })
    await finalizeAppointmentAfterPaymentService(updated.id)

    return res.json({
      success: true,
      providerStatus: paymentStatus ?? null,
      appointment: updated,
      booking: toBookingSummary(updated),
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
