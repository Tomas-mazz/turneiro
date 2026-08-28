import { Client } from '@upstash/qstash'
import { prisma } from '../lib/prisma'

const qstashToken = process.env.QSTASH_TOKEN
const baseUrl = process.env.QSTASH_BASE_URL || process.env.FRONTEND_URL?.replace('www.', 'api.')
const JOB_WARMUP_DELAY_SECONDS = Math.max(
  0,
  Number(process.env.QSTASH_JOB_WARMUP_DELAY_SECONDS ?? 8)
)
const JOB_MAX_RETRIES = 5
const RECONCILE_LOOKBACK_DAYS = Math.max(
  1,
  Number(process.env.APPOINTMENT_JOBS_RECONCILE_LOOKBACK_DAYS ?? 7)
)
const RECONCILE_MAX_APPOINTMENTS = 20

let qstashClient: Client | null = null

function getClient(): Client | null {
  if (!qstashToken) {
    console.warn('QSTASH_TOKEN not configured; jobs will run synchronously')
    return null
  }
  if (!qstashClient) {
    qstashClient = new Client({
      token: qstashToken,
      baseUrl: 'https://qstash-us-east-1.upstash.io',
    })
  }
  return qstashClient
}

export interface AppointmentJobPayload {
  appointmentId: string
  businessId: string
  preloadedOwner?: {
    id: string
    email: string | null
    name: string | null
    googleRefreshToken: string | null
    googleCalendarId: string | null
  } | null
}

export interface DeleteCalendarEventPayload {
  appointmentId: string
  businessId: string
  googleEventId: string | null
  ownerCalendarEventId: string | null
  syncedToUserId: string | null
}

type JobType = 'send-confirmation-email' | 'send-employee-notification' | 'sync-google-calendar' | 'delete-google-calendar-event'
  | 'send-client-reminder'

export async function enqueueJob(
  jobType: JobType,
  payload: AppointmentJobPayload | DeleteCalendarEventPayload,
  delaySeconds: number = 0
): Promise<boolean> {
  const client = getClient()
  
  if (!client || !baseUrl) {
    return false
  }

  const jobUrl = `${baseUrl}/api/jobs/${jobType}`

  try {
    await client.publishJSON({
      url: jobUrl,
      body: payload,
      retries: JOB_MAX_RETRIES,
      delay: delaySeconds,
    })
    console.log(`✅ Job enqueued: ${jobType} for appointment ${payload.appointmentId}`)
    return true
  } catch (err) {
    console.error(`Failed to enqueue job ${jobType}:`, err)
    return false
  }
}

export async function enqueueAppointmentJobs(
  appointmentId: string,
  businessId: string,
  preloadedOwner?: AppointmentJobPayload['preloadedOwner'],
  appointmentStartTime?: Date
): Promise<boolean> {
  const client = getClient()
  
  if (!client || !baseUrl) {
    return false
  }

  const payload: AppointmentJobPayload = {
    appointmentId,
    businessId,
    preloadedOwner,
  }

  // Reminder: 2 hours before appointment start.
  // Note: the final send is still guarded by status + startTime in the job handler.
  const REMINDER_OFFSET_MS = 2 * 60 * 60 * 1000
  const delaySeconds = appointmentStartTime
    ? Math.max(
        0,
        Math.floor((appointmentStartTime.getTime() - Date.now() - REMINDER_OFFSET_MS) / 1000)
      )
    : 0

  try {
    await Promise.all([
      enqueueJob('send-confirmation-email', payload, JOB_WARMUP_DELAY_SECONDS),
      enqueueJob('send-employee-notification', payload, JOB_WARMUP_DELAY_SECONDS),
      enqueueJob('sync-google-calendar', payload, JOB_WARMUP_DELAY_SECONDS),
      enqueueJob('send-client-reminder', payload, delaySeconds),
    ])
    return true
  } catch (err) {
    console.error('Failed to enqueue appointment jobs:', err)
    return false
  }
}

/**
 * Re-enqueue side-effect jobs for recent appointments that still have pending
 * emails or calendar sync. Called when a new booking wakes the server so stuck
 * jobs from earlier reservations are retried together with the new one.
 */
export async function reconcilePendingAppointmentJobs(
  businessId: string,
  preloadedOwner?: AppointmentJobPayload['preloadedOwner'],
  excludeAppointmentId?: string
): Promise<number> {
  if (!isQueueEnabled()) return 0

  const lookback = new Date(Date.now() - RECONCILE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000)

  const pending = await prisma.appointment.findMany({
    where: {
      businessId,
      status: 'UPCOMING',
      createdAt: { gte: lookback },
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      OR: [{ paymentStatus: { not: 'PENDING' } }, { paymentHoldExpiresAt: null }],
      AND: {
        OR: [
          { confirmationSentAt: null },
          { employeeNotificationSentAt: null },
          { googleEventId: null },
        ],
      },
    },
    select: {
      id: true,
      startTime: true,
      clientEmail: true,
      confirmationSentAt: true,
      employeeNotificationSentAt: true,
      googleEventId: true,
    },
    orderBy: { createdAt: 'asc' },
    take: RECONCILE_MAX_APPOINTMENTS,
  })

  const toReconcile = pending.filter((apt) => {
    const needsConfirmation = !!apt.clientEmail && !apt.confirmationSentAt
    const needsEmployeeNotification = !apt.employeeNotificationSentAt
    const needsCalendarSync = !apt.googleEventId
    return needsConfirmation || needsEmployeeNotification || needsCalendarSync
  })

  if (toReconcile.length === 0) return 0

  console.log(
    `Reconciling ${toReconcile.length} pending appointment job(s) for business ${businessId}`
  )

  await Promise.all(
    toReconcile.map((apt) =>
      enqueueAppointmentJobs(apt.id, businessId, preloadedOwner, apt.startTime)
    )
  )

  return toReconcile.length
}

export async function enqueueDeleteCalendarEvent(
  appointmentId: string,
  businessId: string,
  googleEventId: string | null,
  ownerCalendarEventId: string | null,
  syncedToUserId: string | null
): Promise<boolean> {
  if (!isQueueEnabled()) {
    return false
  }

  const payload: DeleteCalendarEventPayload = {
    appointmentId,
    businessId,
    googleEventId,
    ownerCalendarEventId,
    syncedToUserId,
  }

  return enqueueJob('delete-google-calendar-event', payload)
}

export function isQueueEnabled(): boolean {
  return !!qstashToken && !!baseUrl
}
