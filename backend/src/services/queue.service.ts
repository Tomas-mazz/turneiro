import { Client } from '@upstash/qstash'

const qstashToken = process.env.QSTASH_TOKEN
const baseUrl = process.env.QSTASH_BASE_URL || process.env.FRONTEND_URL?.replace('www.', 'api.')

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

export async function enqueueJob(
  jobType: JobType,
  payload: AppointmentJobPayload | DeleteCalendarEventPayload
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
      retries: 3,
      delay: 0,
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
  preloadedOwner?: AppointmentJobPayload['preloadedOwner']
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

  try {
    await Promise.all([
      enqueueJob('send-confirmation-email', payload),
      enqueueJob('send-employee-notification', payload),
      enqueueJob('sync-google-calendar', payload),
    ])
    return true
  } catch (err) {
    console.error('Failed to enqueue appointment jobs:', err)
    return false
  }
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
