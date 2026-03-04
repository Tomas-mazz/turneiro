import crypto from 'crypto'
import { prisma } from '../lib/prisma'
import { getAvailabilityService } from './availability.service'
import type { CreateAppointmentInput } from '../lib/schemas'
import * as stripeService from './stripe.service'
import * as mercadopagoService from './mercadopago.service'
import * as googleCalendarService from './google-calendar.service'
import { sendAppointmentConfirmationEmail } from './email.service'

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
 * Helper: Sync appointment to the appropriate Google Calendar.
 * If the appointment is assigned to an employee with a linked User who has Google Calendar connected, use that calendar.
 * Otherwise fall back to the business owner's calendar.
 */
async function syncToGoogleCalendar(
  appointmentId: string,
  businessId: string
): Promise<void> {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        business: true,
        employee: { include: { user: true } },
      },
    })

    if (!appointment) return

    let targetUser: { id: string; googleRefreshToken: string | null; googleCalendarId: string | null } | null = null
    const isStaffEmployee = appointment.employeeId && appointment.employee && !appointment.employee.isOwner

    if (isStaffEmployee && appointment.employee?.user) {
      const staffUser = appointment.employee.user
      if (staffUser.googleRefreshToken && staffUser.googleCalendarId) {
        targetUser = {
          id: staffUser.id,
          googleRefreshToken: staffUser.googleRefreshToken,
          googleCalendarId: staffUser.googleCalendarId,
        }
      }
    }

    if (!targetUser) {
      const owner = await prisma.user.findFirst({
        where: { businessId, role: 'OWNER' },
        select: {
          id: true,
          googleRefreshToken: true,
          googleCalendarId: true,
        },
      })
      if (owner?.googleRefreshToken && owner?.googleCalendarId) {
        targetUser = {
          id: owner.id,
          googleRefreshToken: owner.googleRefreshToken,
          googleCalendarId: owner.googleCalendarId,
        }
      }
    }

    if (!targetUser?.googleRefreshToken || !targetUser?.googleCalendarId) {
      console.log('Google Calendar not connected for business or assigned employee:', businessId)
      return
    }

    const summaryForStaff = `${appointment.serviceName} - ${appointment.clientName}`
    const summaryOwnerOwn = `${appointment.serviceName} - ${appointment.clientName} (con dueño)`
    const summaryOwnerCopyStaff = `${appointment.serviceName} - ${appointment.clientName} (con ${appointment.employee!.name})`

    const eventPayload = {
      description: `Cliente: ${appointment.clientName}\nTeléfono: ${appointment.clientPhone}\nPrecio: $${appointment.price}\nEstado: ${appointment.status}`,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      location: appointment.business.name,
    }

    const eventId = await googleCalendarService.createCalendarEvent(
      targetUser.googleRefreshToken,
      targetUser.googleCalendarId,
      {
        ...eventPayload,
        summary: isStaffEmployee ? summaryForStaff : summaryOwnerOwn,
      }
    )

    let ownerCalendarEventId: string | null = null
    if (isStaffEmployee) {
      const owner = await prisma.user.findFirst({
        where: { businessId, role: 'OWNER' },
        select: { googleRefreshToken: true, googleCalendarId: true },
      })
      if (owner?.googleRefreshToken && owner?.googleCalendarId) {
        try {
          ownerCalendarEventId = await googleCalendarService.createCalendarEvent(
            owner.googleRefreshToken,
            owner.googleCalendarId,
            {
              ...eventPayload,
              summary: summaryOwnerCopyStaff,
              colorId: '9',
            }
          )
        } catch (err) {
          console.error('Failed to create owner calendar copy for staff appointment:', err)
        }
      }
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        googleEventId: eventId,
        syncedToUserId: targetUser.id,
        ...(ownerCalendarEventId ? { ownerCalendarEventId } : {}),
      },
    })

    console.log(`✅ Appointment ${appointmentId} synced to Google Calendar (user ${targetUser.id})`)
  } catch (error) {
    console.error('Error syncing to Google Calendar:', error)
    // Don't throw - we don't want to fail appointment creation if GC sync fails
  }
}

/**
 * Helper: Delete event from the Google Calendar it was synced to (syncedToUserId or owner).
 */
async function deleteFromGoogleCalendar(
  appointmentId: string,
  businessId: string
): Promise<void> {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { syncedToUser: true },
    })

    const googleEventId = appointment?.googleEventId
    let refreshToken: string | null = null
    let calendarId: string | null = null

    if (googleEventId) {
      if (appointment?.syncedToUserId && appointment.syncedToUser?.googleRefreshToken && appointment.syncedToUser?.googleCalendarId) {
        refreshToken = appointment.syncedToUser.googleRefreshToken
        calendarId = appointment.syncedToUser.googleCalendarId
      }
      if (!refreshToken || !calendarId) {
        const owner = await prisma.user.findFirst({
          where: { businessId, role: 'OWNER' },
        })
        refreshToken = owner?.googleRefreshToken ?? null
        calendarId = owner?.googleCalendarId ?? null
      }
      if (refreshToken && calendarId) {
        await googleCalendarService.deleteCalendarEvent(
          refreshToken,
          calendarId,
          googleEventId
        )
        console.log(`✅ Event deleted from Google Calendar: ${googleEventId}`)
      }
    }

    const ownerEventId = appointment?.ownerCalendarEventId
    if (ownerEventId) {
      const owner = await prisma.user.findFirst({
        where: { businessId, role: 'OWNER' },
        select: { googleRefreshToken: true, googleCalendarId: true },
      })
      if (owner?.googleRefreshToken && owner?.googleCalendarId) {
        try {
          await googleCalendarService.deleteCalendarEvent(
            owner.googleRefreshToken,
            owner.googleCalendarId,
            ownerEventId
          )
          console.log(`✅ Owner calendar copy deleted: ${ownerEventId}`)
        } catch (err) {
          console.error('Error deleting owner calendar copy:', err)
        }
      }
    }
  } catch (error) {
    console.error('Error deleting from Google Calendar:', error)
  }
}

/**
 * After a STAFF user connects Google Calendar, re-sync all their UPCOMING appointments
 * to their calendar. If an appointment was previously synced to the owner's calendar,
 * delete it from there and create it on the staff's calendar.
 * Does not throw; logs errors so OAuth callback is not failed.
 */
export async function resyncStaffUpcomingAppointmentsToOwnCalendar(
  staffUserId: string
): Promise<void> {
  try {
    const staffUser = await prisma.user.findUnique({
      where: { id: staffUserId },
      select: {
        role: true,
        businessId: true,
        googleRefreshToken: true,
        googleCalendarId: true,
      },
    })
    if (
      !staffUser ||
      staffUser.role !== 'STAFF' ||
      !staffUser.businessId ||
      !staffUser.googleRefreshToken ||
      !staffUser.googleCalendarId
    ) {
      return
    }

    const employee = await prisma.employee.findFirst({
      where: { userId: staffUserId, businessId: staffUser.businessId },
      select: { id: true },
    })
    if (!employee) return

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId: staffUser.businessId,
        employeeId: employee.id,
        status: 'UPCOMING',
      },
      orderBy: { startTime: 'asc' },
      include: {
        business: true,
        employee: true,
        syncedToUser: true,
      },
    })

    for (const appointment of appointments) {
      try {
        if (appointment.syncedToUserId === staffUserId) continue

        const existingEventId = appointment.googleEventId
        const previousSyncedUserId = appointment.syncedToUserId

        if (existingEventId && previousSyncedUserId && previousSyncedUserId !== staffUserId) {
          const previousUser = await prisma.user.findUnique({
            where: { id: previousSyncedUserId },
            select: { googleRefreshToken: true, googleCalendarId: true },
          })
          if (
            previousUser?.googleRefreshToken &&
            previousUser?.googleCalendarId
          ) {
            await googleCalendarService.deleteCalendarEvent(
              previousUser.googleRefreshToken,
              previousUser.googleCalendarId,
              existingEventId
            )
          }
        } else if (existingEventId && !previousSyncedUserId) {
          const owner = await prisma.user.findFirst({
            where: { businessId: staffUser.businessId, role: 'OWNER' },
            select: { googleRefreshToken: true, googleCalendarId: true },
          })
          if (owner?.googleRefreshToken && owner?.googleCalendarId) {
            try {
              await googleCalendarService.deleteCalendarEvent(
                owner.googleRefreshToken,
                owner.googleCalendarId,
                existingEventId
              )
            } catch {
              // best effort; event might not exist on owner calendar
            }
          }
        }

        const summaryForStaff = `${appointment.serviceName} - ${appointment.clientName}`
        const summaryForOwner = `${appointment.serviceName} - ${appointment.clientName} (con ${appointment.employee?.name ?? 'dueño'})`
        const eventPayload = {
          description: `Cliente: ${appointment.clientName}\nTeléfono: ${appointment.clientPhone}\nPrecio: $${appointment.price}\nEstado: ${appointment.status}`,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          location: appointment.business.name,
        }

        const eventId = await googleCalendarService.createCalendarEvent(
          staffUser.googleRefreshToken,
          staffUser.googleCalendarId,
          { ...eventPayload, summary: summaryForStaff }
        )

        let ownerCalendarEventId: string | null = null
        const owner = await prisma.user.findFirst({
          where: { businessId: staffUser.businessId, role: 'OWNER' },
          select: { googleRefreshToken: true, googleCalendarId: true },
        })
        if (owner?.googleRefreshToken && owner?.googleCalendarId) {
          try {
            ownerCalendarEventId = await googleCalendarService.createCalendarEvent(
              owner.googleRefreshToken,
              owner.googleCalendarId,
              { ...eventPayload, summary: summaryForOwner, colorId: '9' }
            )
          } catch (err) {
            console.error('Resync: failed to create owner calendar copy:', err)
          }
        }

        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            googleEventId: eventId,
            syncedToUserId: staffUserId,
            ...(ownerCalendarEventId ? { ownerCalendarEventId } : {}),
          },
        })
      } catch (err) {
        console.error(
          `resyncStaffUpcomingAppointments: failed for appointment ${appointment.id}:`,
          err
        )
      }
    }
  } catch (error) {
    console.error('resyncStaffUpcomingAppointmentsToOwnCalendar:', error)
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
  const employeeId = data.employeeId ?? undefined
  const slots = await getAvailabilityService(
    data.businessSlug,
    data.serviceId,
    date,
    data.date,
    // When multi-employee is enabled on frontend, this will scope availability
    // to the selected employee. For now, keep it optional for backwards compatibility.
    employeeId
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
      employeeId: employeeId ?? null,
      startTime,
      endTime,
      serviceName: service.name,
      price: service.price,
      paymentStatus: 'PENDING',
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientPhone: data.clientPhone,
      status: 'UPCOMING',
      cancellationToken,
    },
  })

  // Sync to Google Calendar asynchronously (don't block response)
  syncToGoogleCalendar(appointment.id, business.id).catch(err => {
    console.error('Failed to sync to Google Calendar:', err)
  })

  // Send confirmation email asynchronously (don't block response)
  sendAppointmentConfirmationEmail(appointment.id).catch(err => {
    console.error('Failed to send confirmation email:', err)
  })

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
  const aptPaymentIntentId = appointment.paymentIntentId
  const aptPaymentProvider = appointment.paymentProvider

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
      refundAmount: refundAmount > 0 ? refundAmount : undefined,
    },
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
  businessId: string,
  employeeId?: string | null
): Promise<AppointmentListItem[]> {
  const where: {
    businessId: string
    status: string
    employeeId?: string
  } = {
    businessId,
    status: 'UPCOMING',
  }
  if (employeeId != null && employeeId !== '') {
    where.employeeId = employeeId
  }
  const appointments = await prisma.appointment.findMany({
    where,
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

/** Normalize phone for comparison: digits only (and optional leading +) */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

export async function getAppointmentsByPhoneService(
  businessId: string,
  phone: string,
  staffEmployeeId?: string | null
): Promise<AppointmentListItem[]> {
  const trimmed = phone.trim()
  if (!trimmed) return []

  const normalizedInput = normalizePhone(trimmed)
  const where: {
    businessId: string
    status: string
    employeeId?: string
  } = {
    businessId,
    status: 'UPCOMING',
  }
  if (staffEmployeeId != null && staffEmployeeId !== '') {
    where.employeeId = staffEmployeeId
  }
  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { startTime: 'asc' },
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
  return appointments.filter(
    (a) => normalizePhone(a.clientPhone) === normalizedInput
  )
}

export interface AdminAppointmentListItem extends AppointmentListItem {
  businessId: string
  businessName: string
  cancellationReason: string | null
  refundAmount: number | null
}

export async function getAppointmentsForAdminService(params: {
  businessId?: string
  dateFrom?: string
  dateTo?: string
  status?: string
}): Promise<AdminAppointmentListItem[]> {
  const where: Record<string, unknown> = {}

  if (params.businessId) {
    where.businessId = params.businessId
  }
  if (params.status) {
    where.status = params.status
  }
  if (params.dateFrom || params.dateTo) {
    const start: Date | undefined = params.dateFrom
      ? new Date(params.dateFrom + 'T00:00:00')
      : undefined
    const end: Date | undefined = params.dateTo
      ? new Date(params.dateTo + 'T23:59:59.999')
      : undefined
    where.startTime = {
      ...(start ? { gte: start } : {}),
      ...(end ? { lte: end } : {}),
    }
  }

  const appointments = await prisma.appointment.findMany({
    where,
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
      cancellationReason: true,
      refundAmount: true,
      businessId: true,
      business: {
        select: {
          name: true,
        },
      },
    },
  })

  return appointments.map((a) => ({
    id: a.id,
    startTime: a.startTime,
    endTime: a.endTime,
    serviceName: a.serviceName,
    price: a.price,
    clientName: a.clientName,
    clientPhone: a.clientPhone,
    status: a.status,
    paymentStatus: a.paymentStatus,
    businessId: a.businessId,
    businessName: a.business.name,
    cancellationReason: a.cancellationReason,
    refundAmount: a.refundAmount ?? null,
  }))
}

export async function adminCancelAppointmentService(
  appointmentId: string,
  reason: string
) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { business: { include: { settings: true } } },
  })

  if (!appointment) {
    throw new CancellationNotAllowedError('Cita no encontrada')
  }
  if (appointment.status === 'CANCELLED') {
    throw new CancellationNotAllowedError('La cita ya fue cancelada')
  }

  // For admin cancellation, we mirror owner behaviour: full refund when paid.
  let refundAmount = 0
  const aptPaymentIntentId = appointment.paymentIntentId
  const aptPaymentProvider = appointment.paymentProvider

  if (
    appointment.paymentStatus === 'PAID' &&
    aptPaymentIntentId &&
    aptPaymentProvider
  ) {
    try {
      if (aptPaymentProvider === 'STRIPE') {
        const refund = await stripeService.processRefund(aptPaymentIntentId)
        refundAmount = refund.amount
      } else if (aptPaymentProvider === 'MERCADOPAGO') {
        const refund = await mercadopagoService.processRefund(
          aptPaymentIntentId
        )
        refundAmount = refund.amount
      }
    } catch (error) {
      console.error('Refund error during admin cancellation:', error)
      // Continue with cancellation even if refund fails
    }
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: 'CANCELLED',
      cancellationReason: reason,
      paymentStatus: refundAmount > 0 ? 'REFUNDED' : appointment.paymentStatus,
      refundAmount: refundAmount > 0 ? refundAmount : undefined,
    },
  })

  // Delete from Google Calendar asynchronously
  deleteFromGoogleCalendar(appointmentId, appointment.businessId).catch(err =>
    console.error('Failed to delete from Google Calendar (admin):', err)
  )

  return { cancelled: true, id: appointment.id, refunded: refundAmount > 0 }
}

export async function adminUpdateAppointmentStatusService(
  appointmentId: string,
  status: 'UPCOMING' | 'COMPLETED'
) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  })

  if (!appointment) {
    throw new CancellationNotAllowedError('Cita no encontrada')
  }
  if (appointment.status === 'CANCELLED') {
    throw new CancellationNotAllowedError(
      'No se puede cambiar el estado de una cita cancelada'
    )
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status,
    },
  })

  return {
    id: updated.id,
    status: updated.status,
  }
}

export async function cancelAppointmentByOwnerService(
  appointmentId: string,
  businessId: string,
  reason: string,
  staffEmployeeId?: string | null
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
  if (staffEmployeeId !== undefined) {
    if (staffEmployeeId == null || staffEmployeeId === '') {
      throw new CancellationNotAllowedError(
        'No tenés un perfil de empleado vinculado. Solo podés cancelar turnos asignados a vos.'
      )
    }
    if (appointment.employeeId !== staffEmployeeId) {
      throw new CancellationNotAllowedError(
        'No podés cancelar esta cita. Solo podés cancelar turnos asignados a vos.'
      )
    }
  }

  // Process full refund when owner cancels (business's responsibility)
  let refundAmount = 0
  const aptPaymentIntentId = appointment.paymentIntentId
  const aptPaymentProvider = appointment.paymentProvider

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
      refundAmount: refundAmount > 0 ? refundAmount : undefined,
    },
  })

  // Delete from Google Calendar asynchronously
  deleteFromGoogleCalendar(appointmentId, businessId).catch(err =>
    console.error('Failed to delete from Google Calendar:', err)
  )

  return { cancelled: true, id: appointment.id, refunded: refundAmount > 0 }
}
