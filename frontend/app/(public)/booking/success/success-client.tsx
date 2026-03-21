'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { BookingDone } from '@/app/(public)/[business-slug]/components/BookingDone'
import type { CreatedAppointment } from '@/app/(public)/[business-slug]/types'

const MP_BOOKING_KEY = 'mp_booking'

type StoredBooking = {
  appointmentId: string
  preferenceId: string
  serviceName: string
  startTime: string
  endTime: string
  cancellationToken: string
  businessSlug: string
  primaryColor?: string
}

function pickMercadoPagoPaymentId(searchParams: URLSearchParams): string | null {
  const direct = searchParams.get('payment_id')
  if (direct && /^\d+$/.test(direct.trim())) return direct.trim()
  const ids = searchParams.get('payment_ids')
  if (ids) {
    const first = ids.split(',')[0]?.trim()
    if (first && /^\d+$/.test(first)) return first
  }
  const collection = searchParams.get('collection_id')
  if (collection && /^\d+$/.test(collection.trim())) return collection.trim()
  return null
}

export function BookingSuccessClient() {
  const searchParams = useSearchParams()
  const appointmentId = searchParams.get('appointmentId')
  const mercadoPagoPaymentIdFromUrl = pickMercadoPagoPaymentId(searchParams)

  const [booking, setBooking] = useState<StoredBooking | null>(null)
  const [appointmentForDone, setAppointmentForDone] = useState<CreatedAppointment | null>(null)
  const [primaryColor, setPrimaryColor] = useState('#f5f5f5')
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

    const color = data.primaryColor?.trim() || '#f5f5f5'
    setPrimaryColor(color)

    api
      .post('/payments/confirm', {
        appointmentId: data.appointmentId,
        paymentIntentId: data.preferenceId,
        mercadoPagoPaymentId: mercadoPagoPaymentIdFromUrl,
      })
      .then(() => {
        setBooking(data)
        setAppointmentForDone({
          id: data.appointmentId,
          startTime: data.startTime,
          endTime: data.endTime,
          serviceName: data.serviceName,
          cancellationToken: data.cancellationToken || null,
        })
        sessionStorage.removeItem(MP_BOOKING_KEY)
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'No se pudo confirmar el pago')
      })
      .finally(() => setConfirming(false))
  }, [appointmentId, mercadoPagoPaymentIdFromUrl])

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

  if (!booking || !appointmentForDone) return null

  const cancelUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/cancel?token=${booking.cancellationToken}`
      : '#'

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-neutral-100 px-4 py-12">
      <BookingDone appointment={appointmentForDone} primaryColor={primaryColor} />
      {booking.cancellationToken && (
        <p className="mt-6 max-w-md text-center text-sm text-neutral-500">
          Para cancelar:{' '}
          <a href={cancelUrl} className="text-blue-600 underline">
            Cancelar cita
          </a>
        </p>
      )}
      <Link
        href={booking.businessSlug ? `/${booking.businessSlug}` : '/'}
        className="mt-4 text-blue-600 underline"
      >
        Volver al negocio
      </Link>
    </main>
  )
}
