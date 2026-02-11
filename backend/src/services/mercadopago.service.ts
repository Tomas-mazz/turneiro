import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'

if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  throw new Error('MERCADOPAGO_ACCESS_TOKEN is not defined')
}

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
})

const preferenceClient = new Preference(client)
const paymentClient = new Payment(client)

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
  }
): Promise<{ preferenceId: string; initPoint: string }> {
  try {
    const preference = await preferenceClient.create({
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
        auto_return: 'approved',
        notification_url: `${process.env.APP_URL}/api/webhooks/mercadopago`,
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
  amount?: number
): Promise<{ refundId: string; amount: number; status: string }> {
  try {
    // Get payment details first
    const payment = await paymentClient.get({ id: Number(paymentId) })
    
    // Create refund through API using type assertion for refund method
    const refundBody: MercadoPagoRefundBody = {}
    if (amount !== undefined) {
      refundBody.amount = amount
    }

    // Use type assertion since SDK types might be incomplete
    const refundClient = paymentClient as unknown as RefundCapablePaymentClient
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
 * Verify Mercado Pago webhook signature (IPN notification)
 */
export async function verifyWebhookSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string
): Promise<boolean> {
  // Mercado Pago uses x-signature and x-request-id headers for webhook verification
  // For now, we'll implement basic verification
  // In production, you should implement HMAC verification with webhook secret
  
  if (!xSignature || !xRequestId) {
    return false
  }

  // Keep parameter for future HMAC payload checks
  void dataId

  // TODO: Implement full HMAC verification when Mercado Pago provides webhook secret
  return true
}

/**
 * Get payment details
 */
export async function getPayment(paymentId: string): Promise<unknown> {
  try {
    const payment = await paymentClient.get({ id: Number(paymentId) })
    return payment
  } catch (error) {
    console.error('Mercado Pago getPayment error:', error)
    throw new Error('Failed to retrieve payment')
  }
}
