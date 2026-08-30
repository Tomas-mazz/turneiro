import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import {
  buildClientCancellationEmailHtml,
  buildClientConfirmationEmailHtml,
  buildClientReminderEmailHtml,
  buildStaffAppointmentEmailHtml,
  buildStaffCancellationEmailHtml,
  formatPriceLine,
  type BusinessContactInfo,
} from '../lib/email-templates'
import { prisma } from '../lib/prisma'
import { buildPaymentSummaryLines } from '../lib/paymentSummary'

type AppointmentPaymentMode = 'UNPAID' | 'DEPOSIT' | 'FULL'

let cachedTransporter: Transporter | null = null

function resetTransporter(): void {
  if (!cachedTransporter) return
  try {
    cachedTransporter.close()
  } catch {
    // Ignore close errors on stale pooled connections.
  }
  cachedTransporter = null
}

function getTransporter(): Transporter | null {
  if (cachedTransporter) return cachedTransporter

  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) return null

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
  })

  return cachedTransporter
}

async function sendMailWithRetry(
  mailOptions: nodemailer.SendMailOptions,
  maxRetries = 3
): Promise<{ sent: boolean; skippedReason?: 'smtp_not_configured' }> {
  const transport = getTransporter()
  if (!transport) {
    console.warn('SMTP not configured; skipping email')
    return { sent: false, skippedReason: 'smtp_not_configured' }
  }

  let lastError: Error | null = null
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await transport.sendMail(mailOptions)
      return { sent: true }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err))
      console.warn(`Email send attempt ${attempt} failed:`, lastError.message)
      resetTransporter()
      if (attempt < maxRetries) {
        const backoffMs = 1000 * Math.pow(2, attempt - 1)
        await new Promise((r) => setTimeout(r, backoffMs))
      }
    }
  }
  throw lastError
}

function resolvePaymentMode(params: {
  paymentStatus: string
  price: number
  paymentAmount: number | null
}): AppointmentPaymentMode {
  const { paymentStatus, price, paymentAmount } = params

  if (paymentStatus === 'PAID') {
    if (paymentAmount != null && paymentAmount < price) {
      return 'DEPOSIT'
    }
    return 'FULL'
  }

  return 'UNPAID'
}

function formatARS(amount: number): string {
  return amount.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

const ARGENTINA_TIMEZONE = 'America/Argentina/Buenos_Aires'

function formatDateTimeRange(start: Date, end: Date): { dateLabel: string; timeLabel: string } {
  const dateLabel = start.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: ARGENTINA_TIMEZONE,
  })

  const timeLabel = `${start.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: ARGENTINA_TIMEZONE,
  })} – ${end.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: ARGENTINA_TIMEZONE,
  })}`

  return { dateLabel, timeLabel }
}

function formatDateTimeCombined(start: Date, end: Date): string {
  const { dateLabel, timeLabel } = formatDateTimeRange(start, end)
  return `${dateLabel}, ${timeLabel}`
}

function toBusinessContactInfo(business: {
  name: string
  slug?: string | null
  address?: string | null
  phone?: string | null
}): BusinessContactInfo {
  return {
    name: business.name,
    slug: business.slug ?? null,
    address: business.address ?? null,
    phone: business.phone ?? null,
  }
}

async function sendAppointmentConfirmationEmailForAppointment(appointment: unknown): Promise<void> {
  const apt = appointment as {
    id: string
    clientEmail: string | null
    clientName: string
    startTime: Date
    endTime: Date
    cancellationToken: string | null
    paymentStatus: string
    price: number
    paymentAmount: number | null
    serviceName: string
    confirmationSentAt?: Date | null
    business: { name: string; slug?: string | null; address?: string | null; phone?: string | null }
    employee?: { name?: string | null } | null
  }

  if (!apt.clientEmail) {
    console.warn('sendAppointmentConfirmationEmail: appointment has no clientEmail', apt.id)
    return
  }

  if (apt.confirmationSentAt) return

  const paymentMode = resolvePaymentMode({
    paymentStatus: apt.paymentStatus,
    price: apt.price,
    paymentAmount: apt.paymentAmount ?? null,
  })

  const frontendBaseUrl = process.env.FRONTEND_BASE_URL ?? 'http://localhost:3000'
  const cancelUrl = apt.cancellationToken
    ? `${frontendBaseUrl}/cancel?token=${apt.cancellationToken}`
    : frontendBaseUrl

  const dateTimeLabel = formatDateTimeCombined(apt.startTime, apt.endTime)

  const html = buildClientConfirmationEmailHtml({
    business: toBusinessContactInfo(apt.business),
    serviceName: apt.serviceName,
    dateTimeLabel,
    priceLabel: formatPriceLine({
      paymentMode,
      price: apt.price,
      paymentAmount: apt.paymentAmount ?? null,
      formatAmount: formatARS,
    }),
    employeeName: apt.employee?.name ?? null,
    cancelUrl,
    frontendBaseUrl,
  })

  const fromName = apt.business.name
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || ''
  const subject = `Turno confirmado - ${apt.business.name}`

  const claimedRows = await prisma.$executeRaw`
    UPDATE "Appointment"
    SET "confirmationSentAt" = NOW()
    WHERE "id" = ${apt.id} AND "confirmationSentAt" IS NULL
  `

  if (claimedRows === 0) return

  try {
    const result = await sendMailWithRetry({
      from: `"${fromName}" <${fromEmail}>`,
      to: apt.clientEmail,
      subject,
      html,
    })
    if (result.sent) {
      console.log('✅ Confirmation email sent for appointment', apt.id)
    } else {
      await prisma.$executeRaw`
        UPDATE "Appointment"
        SET "confirmationSentAt" = NULL
        WHERE "id" = ${apt.id}
      `
      console.warn(
        '⚠️ Confirmation email skipped for appointment (SMTP not configured)',
        apt.id
      )
    }
  } catch (err) {
    await prisma.$executeRaw`
      UPDATE "Appointment"
      SET "confirmationSentAt" = NULL
      WHERE "id" = ${apt.id}
    `
    console.error('Failed to send confirmation email for appointment', apt.id, err)
    throw err
  }
}

/**
 * Public API: load appointment from DB and send confirmation email.
 * Kept for callers that only have the ID.
 */
export async function sendAppointmentConfirmationEmail(appointmentId: string): Promise<void> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      business: true,
      employee: true,
    },
  })

  if (!appointment) {
    console.warn('sendAppointmentConfirmationEmail: appointment not found', appointmentId)
    return
  }

  await sendAppointmentConfirmationEmailForAppointment(appointment)
}

/**
 * Optimized API: use an already-loaded appointment (including business & employee)
 * to send the confirmation email without hitting the database again.
 */
export async function sendAppointmentConfirmationEmailUsingLoadedAppointment(
  appointment: unknown
): Promise<void> {
  if (!appointment) return
  await sendAppointmentConfirmationEmailForAppointment(appointment)
}

export interface PreloadedOwner {
  email: string | null
  name: string | null
}

async function sendAppointmentReminderEmailForAppointment(appointment: unknown): Promise<void> {
  const apt = appointment as {
    id: string
    clientEmail: string | null
    clientName: string
    startTime: Date
    endTime: Date
    status: string
    reminderSentAt?: Date | null
    serviceName: string
    business: { name: string; slug?: string | null; address?: string | null; phone?: string | null }
    employee?: { name?: string | null } | null
  }

  if (!apt.clientEmail) {
    console.warn('sendAppointmentReminderEmail: appointment has no clientEmail', apt.id)
    return
  }

  const now = new Date()

  if (apt.status !== 'UPCOMING') return
  if (apt.reminderSentAt) return
  // Don't send reminders for already-started (or in-the-past) appointments.
  if (apt.startTime.getTime() <= now.getTime()) return

  const frontendBaseUrl = process.env.FRONTEND_BASE_URL ?? 'http://localhost:3000'
  const dateTimeLabel = formatDateTimeCombined(apt.startTime, apt.endTime)

  const html = buildClientReminderEmailHtml({
    business: toBusinessContactInfo(apt.business),
    serviceName: apt.serviceName,
    dateTimeLabel,
    employeeName: apt.employee?.name ?? null,
    frontendBaseUrl,
  })

  const fromName = apt.business.name
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || ''
  const subject = `Recordatorio de tu turno - ${apt.business.name}`

  try {
    // Claim sending atomically so only one job instance sends the reminder.
    // (Avoids TypeScript/Prisma typing issues with conditional updates.)
    const claimedRows = await prisma.$executeRaw`
      UPDATE "Appointment"
      SET "reminderSentAt" = NOW()
      WHERE "id" = ${apt.id} AND "reminderSentAt" IS NULL
    `

    if (claimedRows === 0) {
      // Already sent / already claimed by another job.
      return
    }

    const result = await sendMailWithRetry({
      from: `"${fromName}" <${fromEmail}>`,
      to: apt.clientEmail,
      subject,
      html,
    })
    if (result.sent) {
      console.log('✅ Reminder email sent for appointment', apt.id)
    } else {
      console.warn(
        '⚠️ Reminder email skipped for appointment (SMTP not configured)',
        apt.id
      )
    }
  } catch (err) {
    // If sending fails, release the claim so retries can send again.
    await prisma.$executeRaw`
      UPDATE "Appointment"
      SET "reminderSentAt" = NULL
      WHERE "id" = ${apt.id}
    `
    console.error('Failed to send appointment reminder email for appointment', apt.id, err)
  }
}

/**
 * Public API: load appointment from DB and send reminder email to client.
 */
export async function sendAppointmentReminderEmail(appointmentId: string): Promise<void> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      business: true,
      employee: true,
    },
  })

  if (!appointment) {
    console.warn('sendAppointmentReminderEmail: appointment not found', appointmentId)
    return
  }

  await sendAppointmentReminderEmailForAppointment(appointment)
}

/**
 * Optimized API: use an already-loaded appointment (including business & employee)
 * to send the reminder email without hitting the database again.
 */
export async function sendAppointmentReminderEmailUsingLoadedAppointment(
  appointment: unknown
): Promise<void> {
  if (!appointment) return
  await sendAppointmentReminderEmailForAppointment(appointment)
}

/**
 * Notify the assigned employee when a client books an appointment.
 * - Uses the staff user's email (employee.user.email) when available.
 * - If there is no employee or no email, falls back to the preloaded owner or fetches from DB.
 */
async function sendEmployeeAppointmentNotificationForAppointment(
  appointment: unknown,
  preloadedOwner?: PreloadedOwner | null
): Promise<void> {
  const apt = appointment as {
    id: string
    businessId: string
    clientName: string
    clientPhone: string
    clientEmail?: string | null
    serviceName: string
    price: number
    paymentStatus: string
    paymentAmount: number | null
    startTime: Date
    endTime: Date
    employeeNotificationSentAt?: Date | null
    business: { name: string }
    employee?: { name?: string | null; user?: { email?: string | null; name?: string | null } | null } | null
  }

  if (apt.employeeNotificationSentAt) return

  const employee = apt.employee
  const employeeUser = employee?.user as
    | { email: string | null; name: string | null }
    | null
    | undefined

  let targetEmail: string | null = null
  let targetName: string = 'Empleado'

  if (employee && employeeUser?.email) {
    targetEmail = employeeUser.email
    targetName = employee?.name ?? employeeUser.name ?? 'Empleado'
  } else {
    if (preloadedOwner?.email) {
      targetEmail = preloadedOwner.email
      targetName = preloadedOwner.name ?? 'Dueño'
    } else {
      const owner = await prisma.user.findFirst({
        where: { businessId: apt.businessId, role: 'OWNER' },
        select: { email: true, name: true },
      })
      if (owner?.email) {
        targetEmail = owner.email
        targetName = owner.name ?? 'Dueño'
      }
    }
  }

  if (!targetEmail) {
    console.warn(
      'sendEmployeeAppointmentNotification: no employee or owner email, skipping for appointment',
      apt.id
    )
    return
  }

  const dateTimeLabel = formatDateTimeCombined(apt.startTime, apt.endTime)

  const year = apt.startTime.getFullYear()
  const month = String(apt.startTime.getMonth() + 1).padStart(2, '0')
  const day = String(apt.startTime.getDate()).padStart(2, '0')
  const googleCalendarDayUrl = `https://calendar.google.com/calendar/r/day/${year}/${month}/${day}`

  const paymentSummary = buildPaymentSummaryLines({
    paymentStatus: apt.paymentStatus,
    price: apt.price,
    paymentAmount: apt.paymentAmount ?? null,
  })

  const html = buildStaffAppointmentEmailHtml({
    businessName: apt.business.name,
    employeeName: targetName,
    clientName: apt.clientName,
    clientPhone: apt.clientPhone,
    clientEmail: apt.clientEmail ?? null,
    serviceName: apt.serviceName,
    dateTimeLabel,
    paymentTitle: paymentSummary.title,
    paymentLines: paymentSummary.lines,
    googleCalendarDayUrl,
  })

  const fromName = apt.business.name
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || ''
  const subject = `Nuevo turno - ${apt.business.name}`

  const claimedRows = await prisma.$executeRaw`
    UPDATE "Appointment"
    SET "employeeNotificationSentAt" = NOW()
    WHERE "id" = ${apt.id} AND "employeeNotificationSentAt" IS NULL
  `

  if (claimedRows === 0) return

  try {
    const result = await sendMailWithRetry({
      from: `"${fromName}" <${fromEmail}>`,
      to: targetEmail,
      subject,
      html,
    })
    if (result.sent) {
      console.log('✅ Employee notification email sent for appointment', apt.id)
    } else {
      await prisma.$executeRaw`
        UPDATE "Appointment"
        SET "employeeNotificationSentAt" = NULL
        WHERE "id" = ${apt.id}
      `
      console.warn(
        '⚠️ Employee notification email skipped for appointment (SMTP not configured)',
        apt.id
      )
    }
  } catch (err) {
    await prisma.$executeRaw`
      UPDATE "Appointment"
      SET "employeeNotificationSentAt" = NULL
      WHERE "id" = ${apt.id}
    `
    console.error('Failed to send employee notification email for appointment', apt.id, err)
    throw err
  }
}

/**
 * Public API: load appointment from DB and notify employee.
 */
export async function sendEmployeeAppointmentNotification(
  appointmentId: string
): Promise<void> {
  const appointment = await prisma.appointment.findUnique({
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

  if (!appointment) {
    console.warn('sendEmployeeAppointmentNotification: appointment not found', appointmentId)
    return
  }

  await sendEmployeeAppointmentNotificationForAppointment(appointment)
}

/**
 * Optimized API: use an already-loaded appointment (including business & employee.user)
 * to notify the employee without re-querying the database.
 * Accepts optional preloaded owner to avoid extra DB query when employee has no email.
 */
export async function sendEmployeeAppointmentNotificationUsingLoadedAppointment(
  appointment: unknown,
  preloadedOwner?: PreloadedOwner | null
): Promise<void> {
  if (!appointment) return
  await sendEmployeeAppointmentNotificationForAppointment(appointment, preloadedOwner)
}

/**
 * Send cancellation email to client when owner/staff/admin cancels their appointment.
 */
export async function sendCancellationEmailToClient(appointmentId: string, reason: string): Promise<void> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      business: true,
      employee: true,
    },
  })

  if (!appointment) {
    console.warn('sendCancellationEmailToClient: appointment not found', appointmentId)
    return
  }

  if (!appointment.clientEmail) {
    console.warn('sendCancellationEmailToClient: appointment has no clientEmail', appointmentId)
    return
  }

  const frontendBaseUrl = process.env.FRONTEND_BASE_URL ?? 'http://localhost:3000'
  const dateTimeLabel = formatDateTimeCombined(appointment.startTime, appointment.endTime)

  const html = buildClientCancellationEmailHtml({
    business: toBusinessContactInfo(appointment.business),
    serviceName: appointment.serviceName,
    dateTimeLabel,
    employeeName: appointment.employee?.name ?? null,
    cancellationReason: reason,
    frontendBaseUrl,
  })

  const fromName = appointment.business.name
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || ''
  const subject = `Tu turno fue cancelado - ${appointment.business.name}`

  try {
    const result = await sendMailWithRetry({
      from: `"${fromName}" <${fromEmail}>`,
      to: appointment.clientEmail,
      subject,
      html,
    })
    if (result.sent) {
      console.log('✅ Cancellation email sent to client for appointment', appointmentId)
    } else {
      console.warn(
        '⚠️ Cancellation email to client skipped (SMTP not configured) for appointment',
        appointmentId
      )
    }
  } catch (err) {
    console.error('Failed to send cancellation email to client for appointment', appointmentId, err)
  }
}

/**
 * Send cancellation email to employee (or owner as fallback) when client cancels.
 */
export async function sendCancellationEmailToEmployee(appointmentId: string): Promise<void> {
  const appointment = await prisma.appointment.findUnique({
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

  if (!appointment) {
    console.warn('sendCancellationEmailToEmployee: appointment not found', appointmentId)
    return
  }

  const employee = appointment.employee
  const employeeUser = employee?.user as { email: string | null; name: string | null } | null | undefined

  let targetEmail: string | null = null
  let targetName: string = 'Empleado'

  if (employee && employeeUser?.email) {
    targetEmail = employeeUser.email
    targetName = employee?.name ?? employeeUser.name ?? 'Empleado'
  } else {
    const owner = await prisma.user.findFirst({
      where: { businessId: appointment.businessId, role: 'OWNER' },
      select: { email: true, name: true },
    })
    if (owner?.email) {
      targetEmail = owner.email
      targetName = owner.name ?? 'Dueño'
    }
  }

  if (!targetEmail) {
    console.warn(
      'sendCancellationEmailToEmployee: no employee or owner email, skipping for appointment',
      appointmentId
    )
    return
  }

  const dateTimeLabel = formatDateTimeCombined(appointment.startTime, appointment.endTime)

  const html = buildStaffCancellationEmailHtml({
    businessName: appointment.business.name,
    employeeName: targetName,
    clientName: appointment.clientName,
    clientPhone: appointment.clientPhone,
    serviceName: appointment.serviceName,
    dateTimeLabel,
  })

  const fromName = appointment.business.name
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || ''
  const subject = `Un cliente canceló su turno - ${appointment.business.name}`

  try {
    const result = await sendMailWithRetry({
      from: `"${fromName}" <${fromEmail}>`,
      to: targetEmail,
      subject,
      html,
    })
    if (result.sent) {
      console.log('✅ Cancellation email sent to employee for appointment', appointmentId)
    } else {
      console.warn(
        '⚠️ Cancellation email to employee skipped (SMTP not configured) for appointment',
        appointmentId
      )
    }
  } catch (err) {
    console.error('Failed to send cancellation email to employee for appointment', appointmentId, err)
  }
}

