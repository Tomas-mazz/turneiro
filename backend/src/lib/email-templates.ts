/**
 * Minimal, Gmail-friendly HTML email templates (Reservio-inspired).
 * Client emails: only essential booking info.
 * Staff emails: same look, more operational detail.
 */

const FONT =
  "Arial, Helvetica, 'Helvetica Neue', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

const INK = '#222222'
const MUTED = '#555555'
const BORDER = '#e5e5e5'
const LINK = '#1a73e8'
const FOOTER = '#888888'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function emailLink(href: string, label: string): string {
  return `<a href="${href}" style="color:${LINK}; text-decoration:underline;">${escapeHtml(label)}</a>`
}

function fieldBlock(label: string, contentHtml: string): string {
  return `
    <p style="margin:0 0 20px 0; font-size:14px; line-height:1.5; color:${INK};">
      <strong style="display:block; margin-bottom:4px;">${escapeHtml(label)}</strong>
      ${contentHtml}
    </p>
  `
}

function platformFooter(): string {
  return `
    <tr>
      <td style="padding:20px 32px; border-top:1px solid ${BORDER}; text-align:center;">
        <span style="font-size:13px; font-weight:600; letter-spacing:0.02em; color:${FOOTER};">Turneiro</span>
      </td>
    </tr>
  `
}

function wrapEmail(title: string, bodyHtml: string, options?: { footer?: boolean }): string {
  const footer = options?.footer !== false ? platformFooter() : ''

  return `
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charSet="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0; padding:24px 12px; background-color:#ffffff; font-family:${FONT};">
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="max-width:560px; margin:0 auto; border:1px solid ${BORDER};">
      <tr>
        <td style="padding:22px 32px; border-bottom:1px solid ${BORDER}; text-align:center;">
          <p style="margin:0; font-size:18px; font-weight:400; color:${INK};">${escapeHtml(title)}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px 12px 32px;">
          ${bodyHtml}
        </td>
      </tr>
      ${footer}
    </table>
  </body>
</html>
  `.trim()
}

export type BusinessContactInfo = {
  name: string
  slug?: string | null
  address?: string | null
  phone?: string | null
}

export function buildBusinessContactHtml(
  business: BusinessContactInfo,
  frontendBaseUrl: string
): string {
  const lines: string[] = [`<span style="font-weight:600;">${escapeHtml(business.name.toUpperCase())}</span>`]

  if (business.address) {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`
    lines.push(emailLink(mapsUrl, business.address))
  }

  if (business.slug) {
    const bookingUrl = `${frontendBaseUrl.replace(/\/$/, '')}/${business.slug}`
    lines.push(emailLink(bookingUrl, bookingUrl))
  }

  if (business.phone) {
    const telHref = business.phone.replace(/\s/g, '')
    lines.push(emailLink(`tel:${telHref}`, business.phone))
  }

  return lines.join('<br />')
}

export function formatPriceLine(args: {
  paymentMode: 'UNPAID' | 'DEPOSIT' | 'FULL'
  price: number
  paymentAmount: number | null
  formatAmount: (amount: number) => string
}): string {
  const { paymentMode, price, paymentAmount, formatAmount } = args

  if (paymentMode === 'UNPAID') {
    return `$${formatAmount(price)} (a pagar en el local)`
  }

  if (paymentMode === 'DEPOSIT') {
    const paid = paymentAmount ?? 0
    const remaining = Math.max(price - paid, 0)
    return `$${formatAmount(paid)} de seña · restan $${formatAmount(remaining)} en el local`
  }

  const paid = paymentAmount ?? price
  return `$${formatAmount(paid)} (pagado)`
}

/** Client confirmation — minimal, receipt-like. */
export function buildClientConfirmationEmailHtml(args: {
  business: BusinessContactInfo
  serviceName: string
  dateTimeLabel: string
  priceLabel: string
  employeeName?: string | null
  cancelUrl: string
  frontendBaseUrl: string
}): string {
  const {
    business,
    serviceName,
    dateTimeLabel,
    priceLabel,
    employeeName,
    cancelUrl,
    frontendBaseUrl,
  } = args

  const employeeBlock = employeeName
    ? fieldBlock('Profesional', escapeHtml(employeeName))
    : ''

  const body = [
    fieldBlock('Servicio', escapeHtml(serviceName)),
    fieldBlock('Fecha', escapeHtml(dateTimeLabel)),
    fieldBlock('Precio', escapeHtml(priceLabel)),
    employeeBlock,
    fieldBlock('Contacto', buildBusinessContactHtml(business, frontendBaseUrl)),
    `
      <p style="margin:8px 0 0 0; font-size:13px; line-height:1.5; color:${MUTED};">
        ¿Necesitás cancelar?
        ${emailLink(cancelUrl, 'Hacé clic acá')}
      </p>
    `,
  ].join('')

  return wrapEmail('Turno confirmado', body)
}

/** Client reminder — same minimal layout, no cancel CTA. */
export function buildClientReminderEmailHtml(args: {
  business: BusinessContactInfo
  serviceName: string
  dateTimeLabel: string
  employeeName?: string | null
  frontendBaseUrl: string
}): string {
  const { business, serviceName, dateTimeLabel, employeeName, frontendBaseUrl } = args

  const employeeBlock = employeeName
    ? fieldBlock('Profesional', escapeHtml(employeeName))
    : ''

  const body = [
    fieldBlock('Servicio', escapeHtml(serviceName)),
    fieldBlock('Fecha', escapeHtml(dateTimeLabel)),
    employeeBlock,
    fieldBlock('Contacto', buildBusinessContactHtml(business, frontendBaseUrl)),
    `
      <p style="margin:8px 0 0 0; font-size:13px; line-height:1.5; color:${MUTED};">
        Te esperamos. Si no podés asistir, cancelá tu turno desde tu cuenta.
      </p>
    `,
  ].join('')

  return wrapEmail('Recordatorio de turno', body)
}

/** Staff notification — same visual style, more operational detail. */
export function buildStaffAppointmentEmailHtml(args: {
  businessName: string
  employeeName: string
  clientName: string
  clientPhone: string
  clientEmail?: string | null
  serviceName: string
  dateTimeLabel: string
  paymentTitle: string
  paymentLines: string[]
  googleCalendarDayUrl: string
}): string {
  const {
    businessName,
    employeeName,
    clientName,
    clientPhone,
    clientEmail,
    serviceName,
    dateTimeLabel,
    paymentTitle,
    paymentLines,
    googleCalendarDayUrl,
  } = args

  const clientLines = [
    `<strong>${escapeHtml(clientName)}</strong>`,
    escapeHtml(clientPhone),
  ]
  if (clientEmail) {
    clientLines.push(emailLink(`mailto:${clientEmail}`, clientEmail))
  }

  const paymentHtml = [
    `<strong>${escapeHtml(paymentTitle)}</strong>`,
    ...paymentLines.map((line) => escapeHtml(line)),
  ].join('<br />')

  const body = [
    `
      <p style="margin:0 0 20px 0; font-size:14px; line-height:1.5; color:${MUTED};">
        Hola ${escapeHtml(employeeName)}, tenés un nuevo turno en <strong style="color:${INK};">${escapeHtml(businessName)}</strong>.
      </p>
    `,
    fieldBlock('Cliente', clientLines.join('<br />')),
    fieldBlock('Servicio', escapeHtml(serviceName)),
    fieldBlock('Fecha', escapeHtml(dateTimeLabel)),
    fieldBlock('Pago', paymentHtml),
    `
      <p style="margin:0; font-size:13px; line-height:1.5; color:${MUTED};">
        ${emailLink(googleCalendarDayUrl, 'Ver día en Google Calendar')}
      </p>
    `,
  ].join('')

  return wrapEmail('Nuevo turno', body)
}

/** Client cancellation — minimal, same white layout. */
export function buildClientCancellationEmailHtml(args: {
  business: BusinessContactInfo
  serviceName: string
  dateTimeLabel: string
  employeeName?: string | null
  cancellationReason: string
  frontendBaseUrl: string
}): string {
  const { business, serviceName, dateTimeLabel, employeeName, cancellationReason, frontendBaseUrl } =
    args

  const employeeBlock = employeeName
    ? fieldBlock('Profesional', escapeHtml(employeeName))
    : ''

  const body = [
    `
      <p style="margin:0 0 20px 0; font-size:14px; line-height:1.5; color:${MUTED};">
        Tu turno fue cancelado. Podés reservar otro horario cuando quieras.
      </p>
    `,
    fieldBlock('Servicio', escapeHtml(serviceName)),
    fieldBlock('Fecha', escapeHtml(dateTimeLabel)),
    employeeBlock,
    fieldBlock('Motivo', escapeHtml(cancellationReason)),
    fieldBlock('Contacto', buildBusinessContactHtml(business, frontendBaseUrl)),
  ].join('')

  return wrapEmail('Turno cancelado', body)
}

/** Staff cancellation notification. */
export function buildStaffCancellationEmailHtml(args: {
  businessName: string
  employeeName: string
  clientName: string
  clientPhone: string
  serviceName: string
  dateTimeLabel: string
}): string {
  const {
    businessName,
    employeeName,
    clientName,
    clientPhone,
    serviceName,
    dateTimeLabel,
  } = args

  const body = [
    `
      <p style="margin:0 0 20px 0; font-size:14px; line-height:1.5; color:${MUTED};">
        Hola ${escapeHtml(employeeName)}, un cliente canceló su turno en <strong style="color:${INK};">${escapeHtml(businessName)}</strong>.
        El horario queda disponible para nuevas reservas.
      </p>
    `,
    fieldBlock('Cliente', `<strong>${escapeHtml(clientName)}</strong><br />${escapeHtml(clientPhone)}`),
    fieldBlock('Servicio', escapeHtml(serviceName)),
    fieldBlock('Fecha', escapeHtml(dateTimeLabel)),
  ].join('')

  return wrapEmail('Turno cancelado', body)
}
