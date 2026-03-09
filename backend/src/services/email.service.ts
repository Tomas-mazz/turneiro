import nodemailer from 'nodemailer'
import { prisma } from '../lib/prisma'

type AppointmentPaymentMode = 'UNPAID' | 'DEPOSIT' | 'FULL'

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

function formatDateTimeRange(start: Date, end: Date): { dateLabel: string; timeLabel: string } {
  const dateLabel = start.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const timeLabel = `${start.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  })} – ${end.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`

  return { dateLabel, timeLabel }
}

function buildAppointmentEmailHtml(args: {
  businessName: string
  businessAddress?: string | null
  appointmentServiceName: string
  employeeName?: string | null
  clientName: string
  dateLabel: string
  timeLabel: string
  cancelUrl: string
  paymentMode: AppointmentPaymentMode
  price: number
  paymentAmount: number | null
}): string {
  const {
    businessName,
    businessAddress,
    appointmentServiceName,
    employeeName,
    clientName,
    dateLabel,
    timeLabel,
    cancelUrl,
    paymentMode,
    price,
    paymentAmount,
  } = args

  const paymentTitleMap: Record<AppointmentPaymentMode, string> = {
    UNPAID: 'Sin pago',
    DEPOSIT: 'Seña',
    FULL: 'Pago total',
  }

  const paymentExplanationMap: Record<AppointmentPaymentMode, string> = {
    UNPAID: 'Vas a abonar el servicio directamente en el local el día de tu turno.',
    DEPOSIT:
      'Pagaste una seña para reservar este turno. El resto del monto se abonará en el local al finalizar el servicio.',
    FULL:
      'Tu turno ya está pago. No hace falta que abones nada en el local, salvo consumos adicionales.',
  }

  let paymentDetails = ''
  if (paymentMode === 'UNPAID') {
    paymentDetails = `<p style="margin: 4px 0; font-size: 13px; color: #4b5563;">Monto del servicio: <strong>$${formatARS(
      price,
    )}</strong></p>`
  } else if (paymentMode === 'DEPOSIT') {
    const paid = paymentAmount ?? 0
    const remaining = Math.max(price - paid, 0)
    paymentDetails = `
      <p style="margin: 4px 0; font-size: 13px; color: #4b5563;">Monto total del servicio: <strong>$${formatARS(
        price,
      )}</strong></p>
      <p style="margin: 2px 0; font-size: 13px; color: #4b5563;">Seña abonada: <strong>$${formatARS(
        paid,
      )}</strong></p>
      <p style="margin: 2px 0; font-size: 13px; color: #4b5563;">Restante a abonar en el local: <strong>$${formatARS(
        remaining,
      )}</strong></p>
    `
  } else {
    const paid = paymentAmount ?? price
    paymentDetails = `
      <p style="margin: 4px 0; font-size: 13px; color: #4b5563;">Monto total del servicio: <strong>$${formatARS(
        price,
      )}</strong></p>
      <p style="margin: 2px 0; font-size: 13px; color: #4b5563;">Monto abonado: <strong>$${formatARS(
        paid,
      )}</strong></p>
    `
  }

  const employeeLine = employeeName
    ? `<p style="margin: 2px 0; font-size: 13px; color: #4b5563;">Profesional: <strong>${employeeName}</strong></p>`
    : ''

  const addressLine = businessAddress
    ? `<p style="margin: 2px 0; font-size: 13px; color: #4b5563;">Dirección: <strong>${businessAddress}</strong></p>`
    : ''

  const paymentTitle = paymentTitleMap[paymentMode]
  const paymentExplanation = paymentExplanationMap[paymentMode]

  return `
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charSet="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Confirmación de turno - ${businessName}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f3f4f6; font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="background-color:#f3f4f6; padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="max-width:640px; background-color:#f9fafb; border-radius:16px; padding:24px 20px; border:1px solid #e5e7eb;">
            <tr>
              <td style="padding-bottom:16px; border-bottom:1px solid #e5e7eb;">
                <p style="margin:0 0 4px 0; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#9ca3af;">
                  Confirmación de tu turno
                </p>
                <h1 style="margin:0; font-size:20px; color:#111827;">${businessName}</h1>
              </td>
            </tr>

            <tr>
              <td style="padding-top:16px; padding-bottom:12px;">
                <p style="margin:0 0 4px 0; font-size:14px; color:#111827;">
                  Hola ${clientName},
                </p>
                <p style="margin:0; font-size:13px; color:#4b5563;">
                  Tu turno fue agendado correctamente. Guardá este correo para consultar los detalles, agregarlo a tu calendario o cancelarlo si lo necesitás.
                </p>
              </td>
            </tr>

            <tr>
              <td>
                <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="background-color:#ffffff; border-radius:14px; border:1px solid #e5e7eb; padding:16px 16px 14px 16px;">
                  <tr>
                    <td>
                      <p style="margin:0 0 8px 0; font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#9ca3af;">
                        Detalles del turno
                      </p>
                      <p style="margin:0 0 4px 0; font-size:14px; font-weight:600; color:#111827;">
                        ${appointmentServiceName}
                      </p>
                      <p style="margin:0 0 2px 0; font-size:13px; color:#4b5563;">
                        ${dateLabel}
                      </p>
                      <p style="margin:0 0 8px 0; font-size:13px; color:#4b5563;">
                        ${timeLabel}
                      </p>
                      ${employeeLine}
                      ${addressLine}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding-top:16px;">
                <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="background-color:#ffffff; border-radius:14px; border:1px solid #e5e7eb; padding:14px 16px;">
                  <tr>
                    <td style="vertical-align:top;">
                      <p style="margin:0 0 6px 0; font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#9ca3af;">
                        Estado del pago
                      </p>
                      <p style="margin:0 0 4px 0; font-size:13px; font-weight:600; color:#111827;">
                        ${paymentTitle}
                      </p>
                      ${paymentDetails}
                      <p style="margin:8px 0 0 0; font-size:12px; color:#6b7280;">
                        ${paymentExplanation}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding-top:18px; padding-bottom:4px;">
                <table role="presentation" width="100%" cellPadding="0" cellSpacing="0">
                  <tr>
                    <td align="center" style="padding-bottom:10px;">
                      <a
                        href="${cancelUrl}"
                        style="display:inline-block; padding:10px 18px; font-size:13px; font-weight:600; color:#111827; background-color:#e5e7eb; text-decoration:none; border-radius:999px;"
                      >
                        Cancelar turno
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td align="center">
                      <p style="margin:0; font-size:11px; color:#9ca3af;">
                        Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br />
                        <span style="word-break:break-all; color:#6b7280;">${cancelUrl}</span>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding-top:18px; border-top:1px solid #e5e7eb;">
                <p style="margin:0 0 4px 0; font-size:11px; color:#9ca3af;">
                  Este correo fue enviado por ${businessName}. No respondas a este mensaje para reprogramar turnos;
                  usá el enlace de cancelación y reservá un nuevo horario.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`
}

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

  // Temporary type bridge: Prisma types may be stale until `prisma generate` runs.
  const apt: any = appointment

  if (!apt.clientEmail) {
    console.warn('sendAppointmentConfirmationEmail: appointment has no clientEmail', appointmentId)
    return
  }

  const paymentMode = resolvePaymentMode({
    paymentStatus: apt.paymentStatus,
    price: apt.price,
    paymentAmount: apt.paymentAmount ?? null,
  })

  const frontendBaseUrl = process.env.FRONTEND_BASE_URL ?? 'http://localhost:3000'
  const cancelUrl = appointment.cancellationToken
    ? `${frontendBaseUrl}/cancel?token=${appointment.cancellationToken}`
    : frontendBaseUrl

  const { dateLabel, timeLabel } = formatDateTimeRange(appointment.startTime, appointment.endTime)

  const html = buildAppointmentEmailHtml({
    businessName: apt.business.name,
    businessAddress: apt.business.address,
    appointmentServiceName: apt.serviceName,
    employeeName: apt.employee?.name ?? null,
    clientName: apt.clientName,
    dateLabel,
    timeLabel,
    cancelUrl,
    paymentMode,
    price: apt.price,
    paymentAmount: apt.paymentAmount ?? null,
  })

  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    console.warn('SMTP configuration missing; skipping confirmation email for appointment', appointmentId)
    return
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  })

  const fromName = appointment.business.name
  const fromEmail = process.env.EMAIL_FROM || user

  const subject = `Confirmación de tu turno - ${apt.business.name}`

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: apt.clientEmail,
      subject,
      html,
    })
    console.log('✅ Confirmation email sent for appointment', appointmentId)
  } catch (err) {
    console.error('Failed to send confirmation email for appointment', appointmentId, err)
  }
}

/**
 * Build a simple notification email for the assigned employee.
 * This is separate from the client confirmation and focuses on:
 * - who booked
 * - which service
 * - when
 * - a link to open Google Calendar on the appointment date
 */
function buildEmployeeNotificationHtml(args: {
  businessName: string
  employeeName: string
  clientName: string
  clientPhone: string
  serviceName: string
  dateLabel: string
  timeLabel: string
  googleCalendarDayUrl: string
}): string {
  const {
    businessName,
    employeeName,
    clientName,
    clientPhone,
    serviceName,
    dateLabel,
    timeLabel,
    googleCalendarDayUrl,
  } = args

  return `
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charSet="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Nuevo turno agendado - ${businessName}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#0f172a; font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="background-color:#0f172a; padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="max-width:640px; background-color:#020617; border-radius:20px; padding:24px 22px; border:1px solid #1e293b;">
            <tr>
              <td style="padding-bottom:12px; border-bottom:1px solid #1e293b;">
                <p style="margin:0 0 4px 0; font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color:#64748b;">
                  Nuevo turno asignado
                </p>
                <h1 style="margin:0; font-size:20px; color:#e5e7eb;">${businessName}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding-top:14px; padding-bottom:10px;">
                <p style="margin:0 0 4px 0; font-size:14px; color:#e5e7eb;">
                  Hola ${employeeName},
                </p>
                <p style="margin:0; font-size:13px; color:#9ca3af;">
                  Acabás de recibir un nuevo turno en tu agenda. Abajo tenés el resumen rápido con los datos del cliente.
                </p>
              </td>
            </tr>
            <tr>
              <td>
                <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="background-color:#020617; border-radius:14px; border:1px solid #1e293b; padding:16px;">
                  <tr>
                    <td>
                      <p style="margin:0 0 8px 0; font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#64748b;">
                        Detalles del turno
                      </p>
                      <p style="margin:0 0 2px 0; font-size:14px; font-weight:600; color:#e5e7eb;">
                        ${serviceName}
                      </p>
                      <p style="margin:0 0 2px 0; font-size:13px; color:#cbd5f5;">
                        ${dateLabel}
                      </p>
                      <p style="margin:0 0 8px 0; font-size:13px; color:#cbd5f5;">
                        ${timeLabel}
                      </p>
                      <p style="margin:0 0 2px 0; font-size:13px; color:#e5e7eb;">
                        Cliente: <strong>${clientName}</strong>
                      </p>
                      <p style="margin:0; font-size:13px; color:#e5e7eb;">
                        Teléfono: <strong>${clientPhone}</strong>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-top:18px;">
                <table role="presentation" width="100%" cellPadding="0" cellSpacing="0">
                  <tr>
                    <td align="center" style="padding-bottom:10px;">
                      <a
                        href="${googleCalendarDayUrl}"
                        style="display:inline-block; padding:10px 18px; font-size:13px; font-weight:600; color:#020617; background-color:#e5e7eb; text-decoration:none; border-radius:999px;"
                      >
                        Ver día en Google Calendar
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td align="center">
                      <p style="margin:0; font-size:11px; color:#64748b;">
                        Si usás Google Calendar con tu usuario de Appointments, el evento ya figura en tu agenda para ese horario.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`
}

/**
 * Notify the assigned employee when a client books an appointment.
 * - Uses the staff user's email (employee.user.email) when available.
 * - If there is no employee or no email, it silently skips.
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

  const employee = appointment.employee
  const employeeUser = employee?.user as
    | { email: string | null; name: string | null }
    | null
    | undefined

  const employeeEmail = employeeUser?.email ?? null
  const employeeName = employee?.name ?? employeeUser?.name ?? 'Empleado'

  if (!employee || !employeeEmail) {
    // No employee assigned or no email available: nothing to notify.
    console.warn(
      'sendEmployeeAppointmentNotification: no employee or employee email, skipping for appointment',
      appointmentId
    )
    return
  }

  const { dateLabel, timeLabel } = formatDateTimeRange(
    appointment.startTime,
    appointment.endTime
  )

  // Build a day view URL for Google Calendar (does not depend on calendarId).
  const year = appointment.startTime.getFullYear()
  const month = String(appointment.startTime.getMonth() + 1).padStart(2, '0')
  const day = String(appointment.startTime.getDate()).padStart(2, '0')
  const googleCalendarDayUrl = `https://calendar.google.com/calendar/r/day/${year}/${month}/${day}`

  const html = buildEmployeeNotificationHtml({
    businessName: appointment.business.name,
    employeeName,
    clientName: appointment.clientName,
    clientPhone: appointment.clientPhone,
    serviceName: appointment.serviceName,
    dateLabel,
    timeLabel,
    googleCalendarDayUrl,
  })

  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    console.warn(
      'SMTP configuration missing; skipping employee notification email for appointment',
      appointmentId
    )
    return
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  })

  const fromName = appointment.business.name
  const fromEmail = process.env.EMAIL_FROM || user
  const subject = `Nuevo turno asignado - ${appointment.business.name}`

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: employeeEmail,
      subject,
      html,
    })
    console.log('✅ Employee notification email sent for appointment', appointmentId)
  } catch (err) {
    console.error('Failed to send employee notification email for appointment', appointmentId, err)
  }
}

