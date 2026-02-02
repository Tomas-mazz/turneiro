'use client'

import { useState } from 'react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { api } from '@/lib/api'

type StripePaymentFormProps = {
  appointmentId: string
  paymentIntentId: string
  onSuccess: () => void
  onError: (msg: string) => void
  primaryColor: string
}

export function StripePaymentForm({
  appointmentId,
  paymentIntentId,
  onSuccess,
  onError,
  primaryColor,
}: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    onError('')
    try {
      const returnUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/booking/stripe-return?appointmentId=${appointmentId}&paymentIntentId=${encodeURIComponent(paymentIntentId)}`
          : ''
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
          receipt_email: undefined,
        },
      })
      if (error) {
        onError(error.message || 'Error al procesar el pago')
        setLoading(false)
        return
      }
      await api.post('/payments/confirm', { appointmentId, paymentIntentId })
      onSuccess()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Error al confirmar el pago'
      const isTechnical = /prisma|invocation|column|database|ECONNREFUSED/i.test(msg)
      onError(isTechnical ? 'No se pudo confirmar el pago. Por favor intentá de nuevo.' : msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-3 rounded-lg font-medium text-white disabled:opacity-50"
        style={{ backgroundColor: primaryColor }}
      >
        {loading ? 'Procesando...' : 'Pagar'}
      </button>
    </form>
  )
}
