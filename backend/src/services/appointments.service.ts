import crypto from 'crypto'

const PAYMENT_HOLD_MINUTES = 5
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { getAvailabilityService } from './availability.service'
import type { CreateAppointmentInput } from '../lib/schemas'
import * as mercadopagoService from './mercadopago.service'
import * as googleCalendarService from './google-calendar.service'
import {
  sendAppointmentConfirmationEmailUsingLoadedAppointment,
  sendEmployeeAppointmentNotificationUsingLoadedAppointment,
  sendAppointmentReminderEmailUsingLoadedAppointment,
  sendCancellationEmailToClient,
  sendCancellationEmailToEmployee,
  PreloadedOwner,
} from './email.service'
import { buildPaymentSummaryLines } from '../lib/paymentSummary'
import { enqueueAppointmentJobs, enqueueDeleteCalendarEvent, isQueueEnabled } from './queue.service'
import { fromZonedTime } from 'date-fns-tz'

const ARGENTINA_TIMEZONE = 'America/Argentina/Buenos_Aires'

/**
 * Create a UTC Date from a date string (YYYY-MM-DD) and time string (HH:MM) in Argentina timezone.
 * This ensures appointments are stored correctly regardless of server timezone.
 */
function createArgentinaDate(dateStr: string, timeStr: string): Date {
  const dateTimeStr = `${dateStr}T${timeStr}:00`
  return fromZonedTime(dateTimeStr, ARGENTINA_TIMEZONE)
}

interface PreloadedOwnerWithCalendar extends PreloadedOwner {
  id: string
  googleRefreshToken: string | null
  googleCalendarId: string | null
}

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
 * Core helper: given a fully-loaded appointment (with business and employee.user),
 * sync it to the appropriate Google Calendar.
 * If the appointment is assigned to an employee with a linked User who has Google Calendar connected, use that calendar.
 * Otherwise fall back to the business owner's calendar.
 *
 * NOTE: Accepts optional preloaded owner to avoid extra DB queries in hot paths.
 */
async function syncToGoogleCalendarForLoadedAppointment(
  appointment: unknown,
  businessId: string,
  preloadedOwner?: PreloadedOwnerWithCalendar | null
): Promise<void> {
  try {
    const apt = appointment as {
      id: string
      employeeId: string | null
      serviceName: string
      clientName: string
      clientPhone: string
      price: number
      paymentStatus: string
      paymentAmount: number | null
      status: string
      startTime: Date
      endTime: Date
      business: { name: string }
      employee?: {
        isOwner: boolean
        name?: string | null
        ownerCalendarColorId?: string | null
        staffCalendarColorId?: string | null
        user?: { id: string; googleRefreshToken: string | null; googleCalendarId: string | null } | null
      } | null
    }
    let targetUser: { id: string; googleRefreshToken: string | null; googleCalendarId: string | null } | null = null
    const isStaffEmployee = apt.employeeId && apt.employee && !apt.employee.isOwner

    if (isStaffEmployee && apt.employee?.user) {
      const staffUser = apt.employee.user
      if (staffUser.googleRefreshToken && staffUser.googleCalendarId) {
        targetUser = {
          id: staffUser.id,
          googleRefreshToken: staffUser.googleRefreshToken,
          googleCalendarId: staffUser.googleCalendarId,
        }
      }
    }

    let ownerData = preloadedOwner
    if (!targetUser) {
      if (!ownerData) {
        ownerData = await prisma.user.findFirst({
          where: { businessId, role: 'OWNER' },
          select: {
            id: true,
            email: true,
            name: true,
            googleRefreshToken: true,
            googleCalendarId: true,
          },
        })
      }
      if (ownerData?.googleRefreshToken && ownerData?.googleCalendarId) {
        targetUser = {
          id: ownerData.id,
          googleRefreshToken: ownerData.googleRefreshToken,
          googleCalendarId: ownerData.googleCalendarId,
        }
      }
    }

    if (!targetUser?.googleRefreshToken || !targetUser?.googleCalendarId) {
      console.log('Google Calendar not connected for business or assigned employee:', businessId)
      return
    }

    const summaryForStaff = `${apt.serviceName} - ${apt.clientName}`
    const summaryOwnerOwn = `${apt.serviceName} - ${apt.clientName} (con dueño)`
    const summaryOwnerCopyStaff = `${apt.serviceName} - ${apt.clientName} (con ${apt.employee!.name})`

    const paymentSummary = buildPaymentSummaryLines({
      paymentStatus: apt.paymentStatus,
      price: apt.price,
      paymentAmount: apt.paymentAmount ?? null,
    })

    const eventPayload = {
      description: [
        `Cliente: ${apt.clientName}`,
        `Teléfono: ${apt.clientPhone}`,
        `Precio: $${apt.price}`,
        `Estado: ${apt.status}`,
        '',
        paymentSummary.title,
        ...paymentSummary.lines,
      ].join('\n'),
      startTime: apt.startTime,
      endTime: apt.endTime,
      location: apt.business.name,
    }

    let targetColorId: string | undefined
    if (isStaffEmployee && targetUser.id === apt.employee?.user?.id) {
      // Staff user's own calendar: use staff color (random by default).
      targetColorId = apt.employee?.staffCalendarColorId ?? undefined
    } else {
      // Owner calendar: use configured owner color (via owner-employee record).
      const ownerEmp = await prisma.employee.findFirst({
        where: { businessId, isOwner: true },
        select: { ownerCalendarColorId: true },
      })
      targetColorId = ownerEmp?.ownerCalendarColorId ?? undefined
    }

    const eventId = await googleCalendarService.createCalendarEvent(
      targetUser.googleRefreshToken,
      targetUser.googleCalendarId,
      {
        ...eventPayload,
        summary: isStaffEmployee ? summaryForStaff : summaryOwnerOwn,
        ...(targetColorId ? { colorId: targetColorId } : {}),
      }
    )

    let ownerCalendarEventId: string | null = null
    if (isStaffEmployee) {
      if (!ownerData) {
        ownerData = await prisma.user.findFirst({
          where: { businessId, role: 'OWNER' },
          select: {
            id: true,
            email: true,
            name: true,
            googleRefreshToken: true,
            googleCalendarId: true,
          },
        })
      }
      if (ownerData?.googleRefreshToken && ownerData?.googleCalendarId) {
        try {
          const ownerCopyColorId = apt.employee?.ownerCalendarColorId ?? '9'
          ownerCalendarEventId = await googleCalendarService.createCalendarEvent(
            ownerData.googleRefreshToken,
            ownerData.googleCalendarId,
            {
              ...eventPayload,
              summary: summaryOwnerCopyStaff,
              colorId: ownerCopyColorId,
            }
          )
        } catch (err) {
          console.error('Failed to create owner calendar copy for staff appointment:', err)
        }
      }
    }

    await prisma.appointment.update({
      where: { id: apt.id },
      data: {
        googleEventId: eventId,
        syncedToUserId: targetUser.id,
        ...(ownerCalendarEventId ? { ownerCalendarEventId } : {}),
      },
    })

    console.log(`✅ Appointment ${apt.id} synced to Google Calendar (user ${targetUser.id})`)
  } catch (error) {
    console.error('Error syncing to Google Calendar:', error)
  }
}

/**
 * Thin wrapper: fetch appointment by ID and delegate to the core helper.
 * Kept for backwards compatibility in case other callers need it.
 */

/**
 * Helper: Delete event from the Google Calendar it was synced to (syncedToUserId or owner).
 */
async function deleteFromGoogleCalendarForLoadedAppointment(
  appointment: unknown,
  businessId: string
): Promise<void> {
  try {
    const apt = appointment as {
      googleEventId?: string | null
      syncedToUserId?: string | null
      syncedToUser?: { googleRefreshToken?: string | null; googleCalendarId?: string | null } | null
      ownerCalendarEventId?: string | null
    }
    const googleEventId = apt?.googleEventId
    let refreshToken: string | null = null
    let calendarId: string | null = null

    if (googleEventId) {
      if (apt?.syncedToUserId && apt.syncedToUser?.googleRefreshToken && apt.syncedToUser?.googleCalendarId) {
        refreshToken = apt.syncedToUser.googleRefreshToken
        calendarId = apt.syncedToUser.googleCalendarId
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

    const ownerEventId = apt?.ownerCalendarEventId
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
 * Thin wrapper: fetch appointment by ID and delegate to the core helper.
 * Kept for backwards compatibility in case other callers need it.
 */

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
          description: (() => {
            const paymentSummary = buildPaymentSummaryLines({
              paymentStatus: appointment.paymentStatus,
              price: appointment.price,
              paymentAmount: appointment.paymentAmount ?? null,
            })
            return [
              `Cliente: ${appointment.clientName}`,
              `Teléfono: ${appointment.clientPhone}`,
              `Precio: $${appointment.price}`,
              `Estado: ${appointment.status}`,
              '',
              paymentSummary.title,
              ...paymentSummary.lines,
            ].join('\n')
          })(),
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          location: appointment.business.name,
        }

        const staffColorId = appointment.employee?.staffCalendarColorId ?? undefined
        const eventId = await googleCalendarService.createCalendarEvent(
          staffUser.googleRefreshToken,
          staffUser.googleCalendarId,
          { ...eventPayload, summary: summaryForStaff, ...(staffColorId ? { colorId: staffColorId } : {}) }
        )

        let ownerCalendarEventId: string | null = null
        const owner = await prisma.user.findFirst({
          where: { businessId: staffUser.businessId, role: 'OWNER' },
          select: { googleRefreshToken: true, googleCalendarId: true },
        })
        if (owner?.googleRefreshToken && owner?.googleCalendarId) {
          try {
            const ownerCopyColorId = appointment.employee?.ownerCalendarColorId ?? '9'
            ownerCalendarEventId = await googleCalendarService.createCalendarEvent(
              owner.googleRefreshToken,
              owner.googleCalendarId,
              { ...eventPayload, summary: summaryForOwner, colorId: ownerCopyColorId }
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
    include: { settings: true },
  })

  if (!business) {
    throw new SlotUnavailableError('Negocio no encontrado')
  }

  const requestedIds = Array.isArray((data as any).serviceIds) && (data as any).serviceIds.length > 0
    ? ((data as any).serviceIds as string[])
    : data.serviceId
      ? [data.serviceId]
      : []

  if (requestedIds.length === 0) {
    throw new SlotUnavailableError('Servicio no encontrado')
  }

  // Each id can refer to either a Service or a SubService.
  // Prefer SubService when it exists so that price/duration come from the variant.
  type ResolvedItem = {
    kind: 'SERVICE' | 'SUBSERVICE'
    baseServiceId: string
    displayName: string
    price: number
    duration: number
  }

  const resolved: ResolvedItem[] = []
  for (const id of requestedIds) {
    const sub = await prisma.subService.findFirst({
      where: {
        id,
        isActive: true,
        service: { businessId: business.id },
      },
      include: { service: true },
    })
    if (sub) {
      resolved.push({
        kind: 'SUBSERVICE',
        baseServiceId: sub.service.id,
        displayName: `${sub.service.name} - ${sub.name}`,
        price: sub.price,
        duration: sub.duration,
      })
      continue
    }
    const svc = await prisma.service.findFirst({
      where: { id, isActive: true, businessId: business.id },
      select: { id: true, name: true, price: true, duration: true },
    })
    if (!svc) {
      throw new SlotUnavailableError('Servicio no encontrado')
    }
    resolved.push({
      kind: 'SERVICE',
      baseServiceId: svc.id,
      displayName: svc.name,
      price: svc.price,
      duration: svc.duration,
    })
  }

  const finalName = resolved.map((x) => x.displayName).join(' + ')
  const finalPrice = resolved.reduce((acc, x) => acc + (Number.isFinite(x.price) ? x.price : 0), 0)
  const finalDuration = resolved.reduce((acc, x) => acc + (Number.isFinite(x.duration) ? x.duration : 0), 0)
  const appointmentServiceId = resolved.length === 1 ? resolved[0].baseServiceId : null

  const dateForAvailability = new Date(data.date + 'T12:00:00')
  const employeeId = data.employeeId ?? undefined
  const slots = await getAvailabilityService(
    data.businessSlug,
    requestedIds,
    dateForAvailability,
    data.date,
    employeeId
  )

  if (!slots.includes(data.slotTime)) {
    throw new SlotUnavailableError('El horario ya no está disponible')
  }

  // Create startTime and endTime in Argentina timezone, stored as UTC
  const startTime = createArgentinaDate(data.date, data.slotTime)
  const endTime = new Date(startTime.getTime() + finalDuration * 60 * 1000)

  const cancellationToken = crypto.randomBytes(32).toString('hex')

  const appointment = await prisma.appointment.create({
    data: {
      businessId: business.id,
      serviceId: appointmentServiceId,
      employeeId: employeeId ?? null,
      startTime,
      endTime,
      serviceName: finalName,
      price: finalPrice,
      paymentStatus: 'PENDING',
      paymentHoldExpiresAt: data.deferConfirmationUntilPayment
        ? new Date(Date.now() + PAYMENT_HOLD_MINUTES * 60 * 1000)
        : null,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientPhone: data.clientPhone,
      status: 'UPCOMING',
      cancellationToken,
    },
    include: {
      business: true,
      employee: {
        include: {
          user: true,
        },
      },
    },
  })

  // Preload owner once to share across async tasks (avoids multiple DB queries)
  const preloadedOwner = await prisma.user.findFirst({
    where: { businessId: business.id, role: 'OWNER' },
    select: {
      id: true,
      email: true,
      name: true,
      googleRefreshToken: true,
      googleCalendarId: true,
    },
  })

  const shouldDeferConfirmationUntilPayment =
    !!data.deferConfirmationUntilPayment || !!business.settings?.paymentRequired

  // If payment is required/selected, reserve the slot now but defer confirmations
  // (emails + Google Calendar) until payment is confirmed.
  if (!shouldDeferConfirmationUntilPayment) {
    if (isQueueEnabled()) {
      enqueueAppointmentJobs(appointment.id, business.id, preloadedOwner, appointment.startTime).catch(err => {
        console.error('Failed to enqueue appointment jobs:', err)
      })
    } else {
      // Fallback: run tasks directly (may cause connection pool issues under load)
      syncToGoogleCalendarForLoadedAppointment(appointment, business.id, preloadedOwner).catch(err => {
        console.error('Failed to sync to Google Calendar:', err)
      })
      sendAppointmentConfirmationEmailUsingLoadedAppointment(appointment).catch(err => {
        console.error('Failed to send confirmation email:', err)
      })
      sendEmployeeAppointmentNotificationUsingLoadedAppointment(appointment, preloadedOwner).catch(err => {
        console.error('Failed to send employee notification email:', err)
      })

      // Best-effort reminder when queue is not enabled:
      // send immediately only if the reminder window is already reached.
      const REMINDER_OFFSET_MS = 2 * 60 * 60 * 1000
      const msUntilStart = appointment.startTime.getTime() - Date.now()
      if (msUntilStart > 0 && msUntilStart <= REMINDER_OFFSET_MS) {
        sendAppointmentReminderEmailUsingLoadedAppointment(appointment).catch(err => {
          console.error('Failed to send reminder email (fallback):', err)
        })
      }
    }
  }

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

export async function finalizeAppointmentAfterPaymentService(
  appointmentId: string
): Promise<void> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      business: {
        include: { settings: true },
      },
      employee: {
        include: { user: true },
      },
    },
  })

  if (!appointment) return
  if (appointment.paymentStatus !== 'PAID') return
  // Legacy: calendar created implies the post-payment batch already ran.
  if (appointment.googleEventId) return
  // Avoid re-enqueueing on every /payments/confirm refresh when Calendar is slow or unused.
  if (appointment.paymentConfirmationJobsEnqueuedAt) return

  const preloadedOwner = await prisma.user.findFirst({
    where: { businessId: appointment.businessId, role: 'OWNER' },
    select: {
      id: true,
      email: true,
      name: true,
      googleRefreshToken: true,
      googleCalendarId: true,
    },
  })

  if (isQueueEnabled()) {
    const enqueued = await enqueueAppointmentJobs(
      appointment.id,
      appointment.businessId,
      preloadedOwner,
      appointment.startTime
    )
    if (enqueued) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { paymentConfirmationJobsEnqueuedAt: new Date() },
      })
    } else {
      console.error(
        'enqueueAppointmentJobs failed after payment for appointment',
        appointmentId
      )
    }
    return
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { paymentConfirmationJobsEnqueuedAt: new Date() },
  })

  syncToGoogleCalendarForLoadedAppointment(appointment, appointment.businessId, preloadedOwner).catch(err => {
    console.error('Failed to sync to Google Calendar after payment:', err)
  })
  sendAppointmentConfirmationEmailUsingLoadedAppointment(appointment).catch(err => {
    console.error('Failed to send confirmation email after payment:', err)
  })
  sendEmployeeAppointmentNotificationUsingLoadedAppointment(appointment, preloadedOwner).catch(err => {
    console.error('Failed to send employee notification after payment:', err)
  })
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
      if (aptPaymentProvider === 'MERCADOPAGO') {
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

  // Delete from Google Calendar using queue if available
  if (isQueueEnabled()) {
    enqueueDeleteCalendarEvent(
      appointment.id,
      appointment.businessId,
      appointment.googleEventId,
      appointment.ownerCalendarEventId,
      appointment.syncedToUserId
    ).catch(err => console.error('Failed to enqueue calendar delete:', err))
  } else {
    deleteFromGoogleCalendarForLoadedAppointment(appointment, appointment.businessId).catch(err =>
      console.error('Failed to delete from Google Calendar:', err)
    )
  }

  // Send cancellation email to employee (or owner as fallback)
  sendCancellationEmailToEmployee(appointment.id).catch(err =>
    console.error('Failed to send cancellation email to employee:', err)
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
  const where = {
    businessId,
    status: 'UPCOMING',
    // Hide "payment hold" reservations from Citas until they are paid.
    // Free reservations keep paymentStatus=PENDING but have paymentHoldExpiresAt=null.
    AND: [
      {
        OR: [{ paymentStatus: { not: 'PENDING' } }, { paymentHoldExpiresAt: null }],
      },
    ],
  } satisfies Prisma.AppointmentWhereInput
  if (employeeId != null && employeeId !== '') {
    ;(where as Prisma.AppointmentWhereInput).employeeId = employeeId
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
  const where = {
    businessId,
    status: 'UPCOMING',
    // Same as getAppointmentsService: do not include pending payment-hold reservations.
    AND: [
      {
        OR: [{ paymentStatus: { not: 'PENDING' } }, { paymentHoldExpiresAt: null }],
      },
    ],
  } satisfies Prisma.AppointmentWhereInput
  if (staffEmployeeId != null && staffEmployeeId !== '') {
    ;(where as Prisma.AppointmentWhereInput).employeeId = staffEmployeeId
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
  createdAt: Date
}

export async function getAppointmentsForAdminService(params: {
  businessId?: string
  dateFrom?: string
  dateTo?: string
  status?: string
}): Promise<AdminAppointmentListItem[]> {
  const where: Record<string, unknown> = {
    // Hide "payment hold" reservations from admin lists until they are paid.
    // Keeps free reservations (paymentHoldExpiresAt = null).
    AND: [
      {
        OR: [{ paymentStatus: { not: 'PENDING' } }, { paymentHoldExpiresAt: null }],
      },
    ],
  }

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
      createdAt: true,
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
    createdAt: a.createdAt,
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
      if (aptPaymentProvider === 'MERCADOPAGO') {
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

  // Delete from Google Calendar using queue if available
  if (isQueueEnabled()) {
    enqueueDeleteCalendarEvent(
      appointment.id,
      appointment.businessId,
      appointment.googleEventId,
      appointment.ownerCalendarEventId,
      appointment.syncedToUserId
    ).catch(err => console.error('Failed to enqueue calendar delete (admin):', err))
  } else {
    deleteFromGoogleCalendarForLoadedAppointment(appointment, appointment.businessId).catch(err =>
      console.error('Failed to delete from Google Calendar (admin):', err)
    )
  }

  // Send cancellation email to client
  sendCancellationEmailToClient(appointment.id, reason).catch(err =>
    console.error('Failed to send cancellation email to client (admin):', err)
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
      if (aptPaymentProvider === 'MERCADOPAGO') {
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

  // Delete from Google Calendar using queue if available
  if (isQueueEnabled()) {
    enqueueDeleteCalendarEvent(
      appointment.id,
      businessId,
      appointment.googleEventId,
      appointment.ownerCalendarEventId,
      appointment.syncedToUserId
    ).catch(err => console.error('Failed to enqueue calendar delete:', err))
  } else {
    deleteFromGoogleCalendarForLoadedAppointment(appointment, businessId).catch(err =>
      console.error('Failed to delete from Google Calendar:', err)
    )
  }

  // Send cancellation email to client
  sendCancellationEmailToClient(appointment.id, reason).catch(err =>
    console.error('Failed to send cancellation email to client:', err)
  )

  return { cancelled: true, id: appointment.id, refunded: refundAmount > 0 }
}

export interface AppointmentByTokenResult {
  id: string
  serviceName: string
  startTime: Date
  endTime: Date
  status: string
  businessName: string
  employeeName: string | null
}

export async function getAppointmentByTokenService(
  token: string
): Promise<AppointmentByTokenResult | null> {
  const appointment = await prisma.appointment.findUnique({
    where: { cancellationToken: token },
    include: {
      business: { select: { name: true } },
      employee: { select: { name: true } },
    },
  })

  if (!appointment) {
    return null
  }

  return {
    id: appointment.id,
    serviceName: appointment.serviceName,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    status: appointment.status,
    businessName: appointment.business.name,
    employeeName: appointment.employee?.name ?? null,
  }
}
