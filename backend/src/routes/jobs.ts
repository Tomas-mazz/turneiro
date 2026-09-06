import { Router, Request, Response, NextFunction } from 'express'
import { Receiver } from '@upstash/qstash'
import { prisma } from '../lib/prisma'
import {
  sendAppointmentConfirmationEmailUsingLoadedAppointment,
  sendEmployeeAppointmentNotificationUsingLoadedAppointment,
  sendAppointmentReminderEmailUsingLoadedAppointment,
} from '../services/email.service'
import * as googleCalendarService from '../services/google-calendar.service'
import { buildPaymentSummaryLines } from '../lib/paymentSummary'
import type { AppointmentJobPayload, DeleteCalendarEventPayload } from '../services/queue.service'

const router = Router()

const qstashCurrentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY
const qstashNextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY

/**
 * Verifies the QStash signature over the RAW request body, then parses it into `req.body`.
 *
 * These routes have no other authentication, so this must fail closed: without signing keys the
 * endpoints would let anyone send mail to real clients and delete Google Calendar events.
 * `/api/jobs` is mounted with express.raw() in app.ts so `req.body` is the exact byte string
 * QStash signed — re-serializing parsed JSON would change key order/whitespace and never verify.
 */
async function requireQStashSignature(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!qstashCurrentSigningKey || !qstashNextSigningKey) {
    console.error('QStash signing keys not configured; rejecting job request')
    res.status(403).json({ error: 'Job endpoint not configured' })
    return
  }

  const signature = req.headers['upstash-signature'] as string | undefined
  if (!signature) {
    res.status(401).json({ error: 'Invalid signature' })
    return
  }

  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : ''

  try {
    const receiver = new Receiver({
      currentSigningKey: qstashCurrentSigningKey,
      nextSigningKey: qstashNextSigningKey,
    })
    const isValid = await receiver.verify({ signature, body: rawBody })
    if (!isValid) {
      res.status(401).json({ error: 'Invalid signature' })
      return
    }
  } catch {
    res.status(401).json({ error: 'Invalid signature' })
    return
  }

  try {
    req.body = rawBody.length > 0 ? JSON.parse(rawBody) : {}
  } catch {
    res.status(400).json({ error: 'Invalid JSON payload' })
    return
  }
  next()
}

router.use(requireQStashSignature)

async function loadAppointmentWithRelations(appointmentId: string) {
  return prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      business: true,
      employee: {
        include: {
          user: true,
        },
      },
    },
  })
}

router.post('/send-confirmation-email', async (req: Request, res: Response) => {
  const payload = req.body as AppointmentJobPayload

  try {
    const appointment = await loadAppointmentWithRelations(payload.appointmentId)
    if (!appointment) {
      console.warn('Job: appointment not found', payload.appointmentId)
      return res.status(200).json({ success: false, reason: 'appointment_not_found' })
    }

    await sendAppointmentConfirmationEmailUsingLoadedAppointment(appointment)
    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Job send-confirmation-email failed:', err)
    return res.status(500).json({ error: 'Job failed' })
  }
})

router.post('/send-employee-notification', async (req: Request, res: Response) => {
  const payload = req.body as AppointmentJobPayload

  try {
    const appointment = await loadAppointmentWithRelations(payload.appointmentId)
    if (!appointment) {
      console.warn('Job: appointment not found', payload.appointmentId)
      return res.status(200).json({ success: false, reason: 'appointment_not_found' })
    }

    await sendEmployeeAppointmentNotificationUsingLoadedAppointment(appointment, payload.preloadedOwner)
    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Job send-employee-notification failed:', err)
    return res.status(500).json({ error: 'Job failed' })
  }
})

router.post('/send-client-reminder', async (req: Request, res: Response) => {
  const payload = req.body as AppointmentJobPayload

  try {
    const appointment = await loadAppointmentWithRelations(payload.appointmentId)
    if (!appointment) {
      console.warn('Job: appointment not found', payload.appointmentId)
      return res.status(200).json({ success: false, reason: 'appointment_not_found' })
    }

    await sendAppointmentReminderEmailUsingLoadedAppointment(appointment)
    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Job send-client-reminder failed:', err)
    return res.status(500).json({ error: 'Job failed' })
  }
})

router.post('/sync-google-calendar', async (req: Request, res: Response) => {
  const payload = req.body as AppointmentJobPayload

  try {
    const appointment = await loadAppointmentWithRelations(payload.appointmentId)
    if (!appointment) {
      console.warn('Job: appointment not found', payload.appointmentId)
      return res.status(200).json({ success: false, reason: 'appointment_not_found' })
    }

    await syncAppointmentToGoogleCalendar(appointment, payload.businessId, payload.preloadedOwner)
    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Job sync-google-calendar failed:', err)
    return res.status(500).json({ error: 'Job failed' })
  }
})

interface LoadedAppointment {
  id: string
  googleEventId?: string | null
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
    user?: {
      id: string
      googleRefreshToken: string | null
      googleCalendarId: string | null
    } | null
  } | null
}

async function syncAppointmentToGoogleCalendar(
  appointment: LoadedAppointment,
  businessId: string,
  preloadedOwner?: AppointmentJobPayload['preloadedOwner']
): Promise<void> {
  if (appointment.googleEventId) {
    console.log(`Appointment ${appointment.id} already synced to Google Calendar, skipping`)
    return
  }

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

  const summaryForStaff = `${appointment.serviceName} - ${appointment.clientName}`
  const summaryOwnerOwn = `${appointment.serviceName} - ${appointment.clientName} (con dueño)`
  const summaryOwnerCopyStaff = `${appointment.serviceName} - ${appointment.clientName} (con ${appointment.employee?.name ?? 'empleado'})`

  const paymentSummary = buildPaymentSummaryLines({
    paymentStatus: appointment.paymentStatus,
    price: appointment.price,
    paymentAmount: appointment.paymentAmount ?? null,
  })

  const eventPayload = {
    description: [
      `Cliente: ${appointment.clientName}`,
      `Teléfono: ${appointment.clientPhone}`,
      `Precio: $${appointment.price}`,
      `Estado: ${appointment.status}`,
      '',
      paymentSummary.title,
      ...paymentSummary.lines,
    ].join('\n'),
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    location: appointment.business.name,
  }

  let targetColorId: string | undefined
  if (isStaffEmployee && targetUser.id === appointment.employee?.user?.id) {
    targetColorId = appointment.employee?.staffCalendarColorId ?? undefined
  } else {
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
        const ownerCopyColorId = appointment.employee?.ownerCalendarColorId ?? '9'
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
    where: { id: appointment.id },
    data: {
      googleEventId: eventId,
      syncedToUserId: targetUser.id,
      ...(ownerCalendarEventId ? { ownerCalendarEventId } : {}),
    },
  })

  console.log(`✅ Appointment ${appointment.id} synced to Google Calendar (user ${targetUser.id})`)
}

router.post('/delete-google-calendar-event', async (req: Request, res: Response) => {
  const payload = req.body as DeleteCalendarEventPayload

  try {
    await deleteCalendarEventForAppointment(payload)
    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Job delete-google-calendar-event failed:', err)
    return res.status(500).json({ error: 'Job failed' })
  }
})

async function deleteCalendarEventForAppointment(
  payload: DeleteCalendarEventPayload
): Promise<void> {
  const { businessId, googleEventId, ownerCalendarEventId, syncedToUserId } = payload

  if (googleEventId) {
    let refreshToken: string | null = null
    let calendarId: string | null = null

    if (syncedToUserId) {
      const syncedUser = await prisma.user.findUnique({
        where: { id: syncedToUserId },
        select: { googleRefreshToken: true, googleCalendarId: true },
      })
      if (syncedUser?.googleRefreshToken && syncedUser?.googleCalendarId) {
        refreshToken = syncedUser.googleRefreshToken
        calendarId = syncedUser.googleCalendarId
      }
    }

    if (!refreshToken || !calendarId) {
      const owner = await prisma.user.findFirst({
        where: { businessId, role: 'OWNER' },
        select: { googleRefreshToken: true, googleCalendarId: true },
      })
      refreshToken = owner?.googleRefreshToken ?? null
      calendarId = owner?.googleCalendarId ?? null
    }

    if (refreshToken && calendarId) {
      try {
        await googleCalendarService.deleteCalendarEvent(refreshToken, calendarId, googleEventId)
        console.log(`✅ Event deleted from Google Calendar: ${googleEventId}`)
      } catch (err) {
        console.error('Failed to delete calendar event:', err)
      }
    }
  }

  if (ownerCalendarEventId) {
    const owner = await prisma.user.findFirst({
      where: { businessId, role: 'OWNER' },
      select: { googleRefreshToken: true, googleCalendarId: true },
    })
    if (owner?.googleRefreshToken && owner?.googleCalendarId) {
      try {
        await googleCalendarService.deleteCalendarEvent(
          owner.googleRefreshToken,
          owner.googleCalendarId,
          ownerCalendarEventId
        )
        console.log(`✅ Owner calendar copy deleted: ${ownerCalendarEventId}`)
      } catch (err) {
        console.error('Failed to delete owner calendar copy:', err)
      }
    }
  }
}

export default router
