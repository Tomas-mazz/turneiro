'use client'

import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { StripePaymentForm } from './StripePaymentForm'
import type { CreatedAppointment } from '../types'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

type PaymentStepProps = {
  createdAppointment: CreatedAppointment
  selectedDate: string
  selectedSlot: string
  paymentAmount: number | null
  paymentError: string | null
  paymentClientSecret: string | null
  paymentIntentId: string | null
  paymentLoading: boolean
  onStripeIntent: () => void
  onMercadoPagoIntent: () => void
  onStripeSuccess: () => void
  onPaymentError: (msg: string) => void
  primaryColor: string
}

export function PaymentStep({
  createdAppointment,
  selectedDate,
  selectedSlot,
  paymentAmount,
  paymentError,
  paymentClientSecret,
  paymentIntentId,
  paymentLoading,
  onStripeIntent,
  onMercadoPagoIntent,
  onStripeSuccess,
  onPaymentError,
  primaryColor,
}: PaymentStepProps) {
  return (
    <section className="py-12 px-4 max-w-lg mx-auto">
      <h2 className="text-xl font-semibold text-neutral-900 mb-4">Pago</h2>
      <p className="text-sm text-neutral-600 mb-2">
        {createdAppointment.serviceName} · {selectedDate} · {selectedSlot}
      </p>
      {paymentAmount != null && (
        <p className="text-sm font-medium text-neutral-700 mb-4">
          Monto a pagar: {paymentAmount.toFixed(2)}
        </p>
      )}
      {paymentError && <p className="text-sm text-red-600 mb-4">{paymentError}</p>}

      {!paymentClientSecret ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={onStripeIntent}
            disabled={paymentLoading}
            className="w-full py-3 rounded-lg font-medium border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50"
          >
            {paymentLoading ? 'Cargando...' : 'Pagar con tarjeta (Stripe)'}
          </button>
          <button
            type="button"
            onClick={onMercadoPagoIntent}
            disabled={paymentLoading}
            className="w-full py-3 rounded-lg font-medium border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50"
          >
            {paymentLoading ? 'Cargando...' : 'Pagar con Mercado Pago'}
          </button>
        </div>
      ) : (
        paymentClientSecret &&
        paymentIntentId && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret: paymentClientSecret,
              appearance: { theme: 'stripe' },
            }}
          >
            <StripePaymentForm
              appointmentId={createdAppointment.id}
              paymentIntentId={paymentIntentId}
              onSuccess={onStripeSuccess}
              onError={onPaymentError}
              primaryColor={primaryColor}
            />
          </Elements>
        )
      )}
    </section>
  )
}
