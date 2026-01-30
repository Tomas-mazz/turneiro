import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
})

/**
 * Create a Stripe Payment Intent for appointment deposit/payment
 */
export async function createPaymentIntent(
  amount: number,
  currency: string,
  metadata: {
    appointmentId: string
    businessId: string
    clientName: string
    clientPhone: string
  }
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in cents
      currency: currency.toLowerCase(),
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    })

    if (!paymentIntent.client_secret) {
      throw new Error('Payment intent client_secret is null')
    }

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    }
  } catch (error) {
    console.error('Stripe createPaymentIntent error:', error)
    throw new Error('Failed to create payment intent')
  }
}

/**
 * Process a refund for a Stripe payment
 */
export async function processRefund(
  paymentIntentId: string,
  amount?: number
): Promise<{ refundId: string; amount: number; status: string }> {
  try {
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    }

    if (amount !== undefined) {
      refundParams.amount = Math.round(amount * 100) // Amount in cents
    }

    const refund = await stripe.refunds.create(refundParams)

    return {
      refundId: refund.id,
      amount: refund.amount / 100, // Convert back to currency units
      status: refund.status || 'succeeded',
    }
  } catch (error) {
    console.error('Stripe processRefund error:', error)
    throw new Error('Failed to process refund')
  }
}

/**
 * Verify Stripe webhook signature
 */
export async function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Promise<Stripe.Event> {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not defined')
  }

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
    return event
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error)
    throw new Error('Invalid webhook signature')
  }
}

/**
 * Get payment intent details
 */
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    return paymentIntent
  } catch (error) {
    console.error('Stripe getPaymentIntent error:', error)
    throw new Error('Failed to retrieve payment intent')
  }
}
