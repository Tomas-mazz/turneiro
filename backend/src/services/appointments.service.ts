import crypto from 'crypto'
import { prisma } from '../lib/prisma'
import { getAvailabilityService } from './availability.service'
import type { CreateAppointmentInput } from '../lib/schemas'
import * as stripeService from './stripe.service'
import * as mercadopagoService from './mercadopago.service'
import * as googleCalendarService from './google-calendar.service'

export class SlotUnavailableError extends Error {
  constructor(message: string = 'El horario ya no está disponible') {
    super(message)
    this.name = 'SlotUnavailableError'
  }
}

export class CancellationNotAllowedError extends Error {
  constructor(message: string = 'No se puede cancelar') {
    super(message)
    this.name = 'CancellationNotAllowedError'
  }
}

/**
 * Helper: Sync appointment to owner's Google Calendar
 */
async function syncToGoogleCalendar(
  appointmentId: string,
  businessId: string
): Promise<void> {
  try {
    // Get business owner with Google Calendar credentials
    const owner = await prisma.user.findFirst({
      where: {
        businessId,
        role: 'OWNER',
      },
    })

    if (!owner) return

    const refreshToken = (owner as any)?.googleRefreshToken
    const calendarId = (owner as any)?.googleCalendarId

    if (!refreshToken || !calendarId) {
      console.log('Google Calendar not connected for business:', businessId)
      return
    }

    // Get appointment details
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { business: true },
    })

    if (!appointment) return

    // Create event in Google Calendar
    const eventId = await googleCalendarService.createCalendarEvent(
      refreshToken,
      calendarId,
      {
        summary: `${appointment.serviceName} - ${appointment.clientName}`,
        description: `Cliente: ${appointment.clientName}\nTeléfono: ${appointment.clientPhone}\nPrecio: $${appointment.price}\nEstado: ${appointment.status}`,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        location: appointment.business.name,
      }
    )

    // Save Google Event ID to appointment
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        googleEventId: eventId as any,
      } as any,
    })

    console.log(`✅ Appointment ${appointmentId} synced to Google Calendar`)
  } catch (error) {
    console.error('Error syncing to Google Calendar:', error)
    // Don't throw - we don't want to fail appointment creation if GC sync fails
  }
}

/**
 * Helper: Delete event from Google Calendar
 */
async function deleteFromGoogleCalendar(
  appointmentId: string,
  businessId: string
): Promise<void> {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    })

    const googleEventId = (appointment as any)?.googleEventId
    if (!googleEventId) return

    const owner = await prisma.user.findFirst({
      where: {
        businessId,
        role: 'OWNER',
      },
    })

    if (!owner) return

    const refreshToken = (owner as any)?.googleRefreshToken
    const calendarId = (owner as any)?.googleCalendarId

    if (!refreshToken || !calendarId) return

    await googleCalendarService.deleteCalendarEvent(
      refreshToken,
      calendarId,
      googleEventId
    )

    console.log(`✅ Event deleted from Google Calendar: ${googleEventId}`)
  } catch (error) {
    console.error('Error deleting from Google Calendar:', error)
  }
}

export async function createAppointmentService(data: CreateAppointmentInput) {
  const business = await prisma.business.findUnique({
    where: { slug: data.businessSlug },
    include: {
      services: { where: { id: data.serviceId, isActive: true } },
    },
  })

  if (!business) {
    throw new SlotUnavailableError('Negocio no encontrado')
  }

  const service = business.services[0]
  if (!service) {
    throw new SlotUnavailableError('Servicio no encontrado')
  }

  const date = new Date(data.date + 'T12:00:00')
  const slots = await getAvailabilityService(
    data.businessSlug,
    data.serviceId,
    date
  )

  if (!slots.includes(data.slotTime)) {
    throw new SlotUnavailableError('El horario ya no está disponible')
  }

  const [hours, minutes] = data.slotTime.split(':').map(Number)
  const startTime = new Date(date)
  startTime.setHours(hours, minutes, 0, 0)
  const endTime = new Date(startTime.getTime() + service.duration * 60 * 1000)

  const cancellationToken = crypto.randomBytes(32).toString('hex')

  const appointment = await prisma.appointment.create({
    data: {
      businessId: business.id,
      serviceId: service.id,
      startTime,
      endTime,
      serviceName: service.name,
      price: service.price,
      paymentStatus: 'PENDING',
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      status: 'UPCOMING',
      cancellationToken,
    },
  })

  // Sync to Google Calendar asynchronously (don't block response)
  syncToGoogleCalendar(appointment.id, business.id).catch(err =>
    console.error('Failed to sync to Google Calendar:', err)
  )

  return {
    id: appointment.id,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    serviceName: appointment.serviceName,
    price: appointment.price,
    status: appointment.status,
    cancellationToken: appointment.cancellationToken,
  }
}

export async function cancelAppointmentService(token: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { cancellationToken: token },
    include: { business: { include: { settings: true } } },
  })

  if (!appointment) {
    throw new CancellationNotAllowedError('Cita no encontrada')
  }

  if (appointment.status === 'CANCELLED') {
    throw new CancellationNotAllowedError('La cita ya fue cancelada')
  }

  const settings = appointment.business.settings
  const windowHours = settings?.freeCancellationWindow ?? 24
  const cutoff = new Date(appointment.startTime.getTime() - windowHours * 60 * 60 * 1000)
  const now = new Date()
  const isWithinFreeWindow = now <= cutoff

  if (!isWithinFreeWindow) {
    throw new CancellationNotAllowedError(
      `Debes cancelar al menos ${windowHours} horas antes de la cita`
    )
  }

  // Process refund if payment was made
  let refundAmount = 0
  const aptPaymentIntentId = (appointment as any).paymentIntentId
  const aptPaymentProvider = (appointment as any).paymentProvider

  if (
    appointment.paymentStatus === 'PAID' &&
    aptPaymentIntentId &&
    aptPaymentProvider
  ) {
    try {
      if (aptPaymentProvider === 'STRIPE') {
        const refund = await stripeService.processRefund(
          aptPaymentIntentId
        )
        refundAmount = refund.amount
      } else if (aptPaymentProvider === 'MERCADOPAGO') {
        const refund = await mercadopagoService.processRefund(
          aptPaymentIntentId
        )
        refundAmount = refund.amount
      }
    } catch (error) {
      console.error('Refund error during cancellation:', error)
      // Continue with cancellation even if refund fails
      // Admin will need to process refund manually
    }
  }

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      status: 'CANCELLED',
      paymentStatus: refundAmount > 0 ? 'REFUNDED' : appointment.paymentStatus,
      refundAmount: refundAmount > 0 ? (refundAmount as any) : undefined,
    } as any,
  })

  // Delete from Google Calendar asynchronously
  deleteFromGoogleCalendar(appointment.id, appointment.businessId).catch(err =>
    console.error('Failed to delete from Google Calendar:', err)
  )

  return { cancelled: true, id: appointment.id, refunded: refundAmount > 0 }
}

export interface AppointmentListItem {
  id: string
  startTime: Date
  endTime: Date
  serviceName: string
  price: number
  clientName: string
  clientPhone: string
  status: string
  paymentStatus: string
}

export async function getAppointmentsService(
  businessId: string
): Promise<AppointmentListItem[]> {
  const appointments = await prisma.appointment.findMany({
    where: { businessId },
    orderBy: { startTime: 'desc' },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      serviceName: true,
      price: true,
      clientName: true,
      clientPhone: true,
      status: true,
      paymentStatus: true,
    },
  })
  return appointments
}

export async function cancelAppointmentByOwnerService(
  appointmentId: string,
  businessId: string,
  reason: string
) {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, businessId },
    include: { business: { include: { settings: true } } },
  })
  if (!appointment) {
    throw new CancellationNotAllowedError('Cita no encontrada o no pertenece a tu negocio')
  }
  if (appointment.status === 'CANCELLED') {
    throw new CancellationNotAllowedError('La cita ya fue cancelada')
  }

  // Process full refund when owner cancels (business's responsibility)
  let refundAmount = 0
  const aptPaymentIntentId = (appointment as any).paymentIntentId
  const aptPaymentProvider = (appointment as any).paymentProvider

  if (
    appointment.paymentStatus === 'PAID' &&
    aptPaymentIntentId &&
    aptPaymentProvider
  ) {
    try {
      if (aptPaymentProvider === 'STRIPE') {
        const refund = await stripeService.processRefund(
          aptPaymentIntentId
        )
        refundAmount = refund.amount
      } else if (aptPaymentProvider === 'MERCADOPAGO') {
        const refund = await mercadopagoService.processRefund(
          aptPaymentIntentId
        )
        refundAmount = refund.amount
      }
    } catch (error) {
      console.error('Refund error during owner cancellation:', error)
      // Continue with cancellation even if refund fails
      // Admin will need to process refund manually
    }
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: 'CANCELLED',
      cancellationReason: reason,
      paymentStatus: refundAmount > 0 ? 'REFUNDED' : appointment.paymentStatus,
      refundAmount: refundAmount > 0 ? (refundAmount as any) : undefined,
    } as any,
  })

  // Delete from Google Calendar asynchronously
  deleteFromGoogleCalendar(appointmentId, businessId).catch(err =>
    console.error('Failed to delete from Google Calendar:', err)
  )

  return { cancelled: true, id: appointment.id, refunded: refundAmount > 0 }
}
