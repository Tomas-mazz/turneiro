'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

const MP_BOOKING_KEY = 'mp_booking'

type StoredBooking = {
  appointmentId: string
  preferenceId: string
  serviceName: string
  startTime: string
  endTime: string
  cancellationToken: string
  businessSlug: string
}

export function BookingSuccessClient() {
  const searchParams = useSearchParams()
  const appointmentId = searchParams.get('appointmentId')
  const [booking, setBooking] = useState<StoredBooking | null>(null)
  const [confirming, setConfirming] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!appointmentId) {
      setConfirming(false)
      setError('Faltan datos de la reserva')
      return
    }
    const raw = sessionStorage.getItem(MP_BOOKING_KEY)
    if (!raw) {
      setConfirming(false)
      setError('No se encontró la información de la reserva')
      return
    }
    let data: StoredBooking
    try {
      data = JSON.parse(raw) as StoredBooking
    } catch {
      setConfirming(false)
      setError('Datos de reserva inválidos')
      return
    }
    if (data.appointmentId !== appointmentId) {
      setConfirming(false)
      setError('La reserva no coincide')
      return
    }
    api
      .post('/payments/confirm', {
        appointmentId: data.appointmentId,
        paymentIntentId: data.preferenceId,
      })
      .then(() => {
        setBooking(data)
        sessionStorage.removeItem(MP_BOOKING_KEY)
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'No se pudo confirmar el pago')
      })
      .finally(() => setConfirming(false))
  }, [appointmentId])

  if (confirming) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-100">
        <p className="text-neutral-600">Confirmando pago...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-neutral-100 py-12 px-4 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow p-6 text-center">
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Error al confirmar el pago</h2>
          <p className="text-neutral-600 mb-4">{error}</p>
          <Link href="/" className="text-blue-600 underline">
            Volver al inicio
          </Link>
        </div>
      </main>
    )
  }

  if (!booking) return null

  const cancelUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/cancel?token=${booking.cancellationToken}`
      : '#'

  return (
    <main className="min-h-screen bg-neutral-100 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow p-6 text-center">
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">Cita confirmada</h2>
        <p className="text-neutral-600 mb-1">{booking.serviceName}</p>
        <p className="text-neutral-600 text-sm">
          {new Date(booking.startTime).toLocaleString('es')} –{' '}
          {new Date(booking.endTime).toLocaleTimeString('es', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
        {booking.cancellationToken && (
          <p className="mt-4 text-sm text-neutral-500">
            Para cancelar, usa este enlace:{' '}
            <a href={cancelUrl} className="underline text-blue-600">
              Cancelar cita
            </a>
          </p>
        )}
        <Link href={`/${booking.businessSlug}`} className="mt-6 inline-block text-blue-600 underline">
          Volver al negocio
        </Link>
      </div>
    </main>
  )
}

