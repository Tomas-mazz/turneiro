'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

export function StripeReturnClient() {
  const searchParams = useSearchParams()
  const appointmentId = searchParams.get('appointmentId')
  const paymentIntentId = searchParams.get('paymentIntentId')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!appointmentId || !paymentIntentId) {
      setStatus('error')
      setErrorMsg('Faltan datos de la reserva')
      return
    }
    api
      .post('/payments/confirm', { appointmentId, paymentIntentId })
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error')
        setErrorMsg(err.response?.data?.error || 'No se pudo confirmar el pago')
      })
  }, [appointmentId, paymentIntentId])

  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-100">
        <p className="text-neutral-600">Confirmando pago...</p>
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main className="min-h-screen bg-neutral-100 py-12 px-4 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow p-6 text-center">
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Error al confirmar el pago</h2>
          <p className="text-neutral-600 mb-4">{errorMsg}</p>
          <Link href="/" className="text-blue-600 underline">
            Volver al inicio
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-100 py-12 px-4 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow p-6 text-center">
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">Pago confirmado</h2>
        <p className="text-neutral-600 mb-4">Tu cita está reservada.</p>
        <Link href="/" className="text-blue-600 underline">
          Volver al inicio
        </Link>
      </div>
    </main>
  )
}

