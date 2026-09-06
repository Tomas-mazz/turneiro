import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'
import crypto from 'crypto'
import { prisma } from '../lib/prisma'

const fallbackToken = process.env.MERCADOPAGO_ACCESS_TOKEN

const clientsByToken = new Map<string, { preferenceClient: Preference; paymentClient: Payment }>()

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
  options?: { accessToken?: string | null }
): Promise<{ preferenceId: string; initPoint: string }> {
  const { preferenceClient: pref } = getClients(options?.accessToken)
  try {
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
        // Repeated on the Payment resource so webhooks can resolve the appointment without preference_id in metadata.
        external_reference: metadata.appointmentId,
        back_urls: {
          success: `${process.env.FRONTEND_URL}/booking/success?appointmentId=${metadata.appointmentId}`,
          failure: `${process.env.FRONTEND_URL}/booking/failure?appointmentId=${metadata.appointmentId}`,
          pending: `${process.env.FRONTEND_URL}/booking/pending?appointmentId=${metadata.appointmentId}`,
        },
        notification_url: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/webhooks/mercadopago`,
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

/** Max age of a notification before we treat it as a replay. */
const WEBHOOK_MAX_AGE_MS = 5 * 60 * 1000

/** Parses the `ts=...,v1=...` pairs out of the x-signature header. */
function parseSignatureHeader(xSignature: string): { ts?: string; v1?: string } {
  const parsed: { ts?: string; v1?: string } = {}
  for (const part of xSignature.split(',')) {
    const separator = part.indexOf('=')
    if (separator === -1) continue
    const key = part.slice(0, separator).trim()
    const value = part.slice(separator + 1).trim()
    if (key === 'ts') parsed.ts = value
    else if (key === 'v1') parsed.v1 = value
  }
  return parsed
}

function hmacMatches(manifest: string, secret: string, expectedHex: string): boolean {
  const computed = crypto.createHmac('sha256', secret).update(manifest).digest()
  // Buffer.from(..., 'hex') silently truncates on invalid input rather than throwing, so a length
  // check both rejects malformed values and keeps timingSafeEqual (which throws on mismatched
  // lengths) safe.
  const expected = Buffer.from(expectedHex, 'hex')
  if (expected.length !== computed.length) return false
  return crypto.timingSafeEqual(computed, expected)
}

/**
 * Mercado Pago's `ts` has been observed both as epoch seconds (10 digits) and milliseconds (13).
 * Guessing wrong would reject every genuine notification, so normalise by magnitude: any plausible
 * date is far below 1e12 in seconds and far above it in milliseconds.
 */
function tsToEpochMs(ts: string): number | null {
  const value = Number(ts)
  if (!Number.isFinite(value) || value <= 0) return null
  return value < 1e12 ? value * 1000 : value
}

/**
 * Verify a Mercado Pago webhook (IPN) signature.
 *
 * Mercado Pago signs the manifest `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` with the
 * application's webhook secret — the request body is NOT part of the signature. That is fine here
 * because the handler re-fetches the payment from Mercado Pago using `data.id`, which the manifest
 * does cover, so a tampered body cannot change which payment is processed.
 *
 * Fails closed: an unsigned or unverifiable notification is rejected. Callers must not process the
 * notification when this returns false.
 */
export async function verifyWebhookSignature(
  xSignature: string | undefined,
  xRequestId: string | undefined,
  dataId: string | undefined,
  secrets: string[]
): Promise<boolean> {
  if (!xSignature || !xRequestId || !dataId) {
    console.warn('Mercado Pago webhook rechazado: faltan x-signature, x-request-id o data.id')
    return false
  }

  if (secrets.length === 0) {
    console.error(
      'Mercado Pago webhook rechazado: no hay ningún secreto de webhook configurado (MERCADOPAGO_WEBHOOK_SECRET)'
    )
    return false
  }

  const { ts, v1 } = parseSignatureHeader(xSignature)
  if (!ts || !v1) {
    console.warn('Mercado Pago webhook rechazado: x-signature sin ts o v1')
    return false
  }

  // Replay protection.
  const timestampMs = tsToEpochMs(ts)
  if (timestampMs === null || Math.abs(Date.now() - timestampMs) > WEBHOOK_MAX_AGE_MS) {
    console.warn('Mercado Pago webhook rechazado: timestamp fuera de la ventana permitida', { ts })
    return false
  }

  // Mercado Pago lowercases alphanumeric ids when building the manifest.
  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`

  // Businesses using their own Mercado Pago application sign with their own secret, so try each
  // configured secret. HMAC is cheap; this is a handful of hashes, not network calls.
  for (const secret of secrets) {
    if (hmacMatches(manifest, secret, v1)) return true
  }

  console.warn('Mercado Pago webhook rechazado: firma inválida')
  return false
}

/**
 * Every webhook secret that could legitimately have signed a notification: the platform-level one
 * plus any a business configured for its own Mercado Pago application.
 */
export async function listWebhookSigningSecrets(): Promise<string[]> {
  const rows = await prisma.businessSettings.findMany({
    where: { mercadoPagoWebhookSecret: { not: null } },
    select: { mercadoPagoWebhookSecret: true },
  })

  return Array.from(
    new Set(
      [process.env.MERCADOPAGO_WEBHOOK_SECRET ?? null, ...rows.map((r) => r.mercadoPagoWebhookSecret)]
        .map((s) => s?.trim() ?? '')
        .filter((s) => s.length > 0)
    )
  )
}

/**
 * Ask Mercado Pago whether an approved payment exists for this appointment.
 *
 * Preferences are created with `external_reference = appointmentId` (see createPreference), so this
 * is the authoritative server-side way to confirm a payment when the client only knows the
 * preference id. Never trust a client-supplied preference id as proof of payment.
 */
export async function findApprovedPaymentByAppointmentId(
  appointmentId: string,
  options?: { accessToken?: string | null }
): Promise<{ id: string } | null> {
  const { paymentClient } = getClients(options?.accessToken)
  try {
    const found = await paymentClient.search({
      options: { external_reference: appointmentId },
    })
    const approved = (found.results ?? []).find((p) => p.status === 'approved')
    return approved?.id != null ? { id: String(approved.id) } : null
  } catch (error) {
    console.error('Mercado Pago payment search error:', error)
    throw new Error('Failed to search payments')
  }
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
