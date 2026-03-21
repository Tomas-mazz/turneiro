import crypto from 'crypto'
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'

const fallbackToken = process.env.MERCADOPAGO_ACCESS_TOKEN

const clientsByToken = new Map<string, { preferenceClient: Preference; paymentClient: Payment }>()

/**
 * Public URL of the booking app (used for MP redirect back_urls).
 * MERCADOPAGO_REDIRECT_BASE_URL overrides FRONTEND_URL (e.g. ngrok HTTPS for local testing).
 */
function getFrontendBaseUrl(): string {
  const raw =
    process.env.MERCADOPAGO_REDIRECT_BASE_URL?.trim() ||
    process.env.FRONTEND_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    'http://localhost:3000'
  return raw.replace(/\/$/, '')
}

/** Base URL for IPN webhooks (must be reachable by Mercado Pago in production — use HTTPS). */
function getWebhookNotificationBaseUrl(): string {
  const raw =
    process.env.MERCADOPAGO_NOTIFICATION_BASE_URL?.trim() ||
    process.env.BACKEND_PUBLIC_URL?.trim() ||
    process.env.BACKEND_URL?.trim() ||
    'http://localhost:3001'
  return raw.replace(/\/$/, '')
}

function sanitizeReturnOrigin(origin: string | null | undefined): string | null {
  if (!origin || typeof origin !== 'string') return null
  const t = origin.trim()
  if (!t) return null
  try {
    return new URL(t).origin
  } catch {
    return null
  }
}

/**
 * Allow back_urls to match the browser tab that started checkout (same origin as sessionStorage).
 * Without this, barberia.localhost vs localhost breaks mp_booking after redirect.
 */
function isTrustedReturnOrigin(origin: string): boolean {
  let u: URL
  try {
    u = new URL(origin)
  } catch {
    return false
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false

  const extras = (process.env.ALLOWED_RETURN_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  for (const o of extras) {
    try {
      if (new URL(o).origin === u.origin) return true
    } catch {
      /* ignore */
    }
  }

  const configured = [
    process.env.FRONTEND_URL,
    process.env.APP_URL,
    process.env.MERCADOPAGO_REDIRECT_BASE_URL,
  ].filter(Boolean) as string[]

  for (const c of configured) {
    try {
      if (new URL(c).origin === u.origin) return true
    } catch {
      /* ignore */
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    const h = u.hostname
    if (h === 'localhost' || h === '127.0.0.1' || h.endsWith('.localhost')) return true
  }

  return false
}

function resolvePublicBaseForBackUrls(returnOrigin?: string | null): string {
  const sanitized = sanitizeReturnOrigin(returnOrigin)
  if (sanitized && isTrustedReturnOrigin(sanitized)) {
    return sanitized.replace(/\/$/, '')
  }
  return getFrontendBaseUrl()
}

function getClients(accessToken?: string | null): { preferenceClient: Preference; paymentClient: Payment } {
  const token = accessToken?.trim() || fallbackToken
  if (!token) {
    throw new Error('Mercado Pago no configurado: falta MERCADOPAGO_ACCESS_TOKEN')
  }
  const cached = clientsByToken.get(token)
  if (cached) return cached

  const client = new MercadoPagoConfig({ accessToken: token })
  const created = {
    preferenceClient: new Preference(client),
    paymentClient: new Payment(client),
  }
  clientsByToken.set(token, created)
  return created
}

type MercadoPagoRefundBody = { amount?: number }
type MercadoPagoRefundResponse = { id?: string | number }
type RefundCapablePaymentClient = Payment & {
  refund(args: { id: number; body: MercadoPagoRefundBody }): Promise<MercadoPagoRefundResponse>
}

export type CreatePreferenceOptions = {
  accessToken?: string | null
  /** e.g. window.location.origin — must match tab where mp_booking was stored */
  returnOrigin?: string | null
}

/**
 * Create a Mercado Pago Preference for appointment payment
 */
export async function createPreference(
  amount: number,
  title: string,
  metadata: {
    appointmentId: string
    businessId: string
    clientName: string
    clientPhone: string
  },
  options?: CreatePreferenceOptions
): Promise<{ preferenceId: string; initPoint: string }> {
  const { preferenceClient: pref } = getClients(options?.accessToken)
  const publicBase = resolvePublicBaseForBackUrls(options?.returnOrigin)
  const back_urls = {
    success: `${publicBase}/booking/success?appointmentId=${metadata.appointmentId}`,
    failure: `${publicBase}/booking/failure?appointmentId=${metadata.appointmentId}`,
    pending: `${publicBase}/booking/pending?appointmentId=${metadata.appointmentId}`,
  }
  try {
    // MP requires HTTPS for auto_return; plain http (e.g. local dev) omits it — user uses "Volver al sitio".
    const preference = await pref.create({
      body: {
        items: [
          {
            id: metadata.appointmentId,
            title,
            quantity: 1,
            unit_price: amount,
            currency_id: 'ARS', // Default to Argentine Peso for Latin America
          },
        ],
        metadata,
        external_reference: metadata.appointmentId,
        ...(publicBase.startsWith('https://') ? { auto_return: 'approved' as const } : {}),
        back_urls,
        notification_url: `${getWebhookNotificationBaseUrl()}/api/webhooks/mercadopago`,
      },
    })

    return {
      preferenceId: preference.id!,
      initPoint: preference.init_point!,
    }
  } catch (error) {
    console.error('Mercado Pago createPreference error:', error)
    throw new Error('Failed to create payment preference')
  }
}

/**
 * Process a refund for a Mercado Pago payment
 */
export async function processRefund(
  paymentId: string,
  amount?: number,
  options?: { accessToken?: string | null }
): Promise<{ refundId: string; amount: number; status: string }> {
  const { paymentClient: pay } = getClients(options?.accessToken)
  try {
    const payment = await pay.get({ id: Number(paymentId) })

    const refundBody: MercadoPagoRefundBody = {}
    if (amount !== undefined) {
      refundBody.amount = amount
    }

    const refundClient = pay as unknown as RefundCapablePaymentClient
    const refund = await refundClient.refund({
      id: Number(paymentId),
      body: refundBody,
    })

    return {
      refundId: String(refund?.id || paymentId),
      amount: amount || payment.transaction_amount || 0,
      status: 'approved',
    }
  } catch (error) {
    console.error('Mercado Pago processRefund error:', error)
    throw new Error('Failed to process refund')
  }
}

/**
 * Verify Mercado Pago webhook x-signature (HMAC SHA256).
 * @see https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
 */
export function verifyMercadoPagoWebhookSignature(
  xSignature: string | undefined,
  xRequestId: string | undefined,
  dataId: string,
  secrets: string[]
): boolean {
  if (!xSignature?.trim() || !xRequestId?.trim() || !dataId.trim()) {
    return false
  }
  const uniqueSecrets = Array.from(new Set(secrets.map((s) => s.trim()).filter(Boolean)))
  if (uniqueSecrets.length === 0) return false

  const parts = xSignature.split(',')
  let ts: string | undefined
  let v1: string | undefined
  for (const part of parts) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const key = part.slice(0, idx).trim()
    const value = part.slice(idx + 1).trim()
    if (key === 'ts') ts = value
    if (key === 'v1') v1 = value
  }
  if (!ts || !v1) return false

  const normalizedId = /^[a-zA-Z0-9]+$/.test(dataId) ? dataId.toLowerCase() : dataId
  const manifest = `id:${normalizedId};request-id:${xRequestId};ts:${ts};`

  for (const secret of uniqueSecrets) {
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(manifest)
    const digest = hmac.digest('hex')
    if (digest === v1) return true
  }
  return false
}

/** @deprecated Use verifyMercadoPagoWebhookSignature with secrets from env + BusinessSettings */
export async function verifyWebhookSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string
): Promise<boolean> {
  const secrets = [process.env.MERCADOPAGO_WEBHOOK_SECRET].filter(
    (s): s is string => !!s && s.trim().length > 0
  )
  return verifyMercadoPagoWebhookSignature(xSignature, xRequestId, dataId, secrets)
}

export async function getPayment(
  paymentId: string,
  options?: { accessToken?: string | null }
): Promise<unknown> {
  const { paymentClient: pay } = getClients(options?.accessToken)
  try {
    const payment = await pay.get({ id: Number(paymentId) })
    return payment
  } catch (error) {
    console.error('Mercado Pago getPayment error:', error)
    throw new Error('Failed to retrieve payment')
  }
}
