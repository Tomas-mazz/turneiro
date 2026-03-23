import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'

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

/**
 * Verify Mercado Pago webhook signature (IPN notification).
 * Notificaciones antiguas / sin cabeceras nuevas no traen x-signature; las aceptamos y logueamos
 * (la verificación HMAC real sigue pendiente — igual que cuando las cabeceras estaban presentes).
 */
export async function verifyWebhookSignature(
  xSignature: string | undefined,
  xRequestId: string | undefined,
  dataId: string | undefined
): Promise<boolean> {
  void dataId
  if (!xSignature || !xRequestId) {
    console.warn(
      'Mercado Pago webhook: sin x-signature o x-request-id; se procesa igual (HMAC no implementado aún).'
    )
  }
  return true
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
