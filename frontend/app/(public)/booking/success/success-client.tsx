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

type ConfirmBookingPayload = {
  appointmentId: string
  businessSlug: string
  primaryColor: string
  serviceName: string
  startTime: string
  endTime: string
  cancellationToken: string | null
}

type ConfirmPaymentResponse = {
  success?: boolean
  booking?: ConfirmBookingPayload
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
  const [confirming, setConfirming] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const applyBookingFromServer = (b: ConfirmBookingPayload) => {
      const slug = b.businessSlug || ''
      setBooking({
        appointmentId: b.appointmentId,
        preferenceId: '',
        serviceName: b.serviceName,
        startTime: b.startTime,
        endTime: b.endTime,
        cancellationToken: b.cancellationToken || '',
        businessSlug: slug,
        primaryColor: b.primaryColor,
      })
      setAppointmentForDone({
        id: b.appointmentId,
        startTime: b.startTime,
        endTime: b.endTime,
        serviceName: b.serviceName,
        cancellationToken: b.cancellationToken,
      })
    }

    if (!appointmentId) {
      setConfirming(false)
      setError('Faltan datos de la reserva')
      return
    }

    let stored: StoredBooking | null = null
    const raw = sessionStorage.getItem(MP_BOOKING_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as StoredBooking
        if (parsed.appointmentId !== appointmentId) {
          setConfirming(false)
          setError('La reserva no coincide')
          return
        }
        stored = parsed
      } catch {
        setConfirming(false)
        setError('Datos de reserva inválidos')
        return
      }
    }

    // Sin sessionStorage (p. ej. www vs apex): confirmar con appointmentId + payment_id de la URL,
    // o si el webhook ya marcó PAID el backend devuelve booking igual.
    if (!stored && !mercadoPagoPaymentIdFromUrl) {
      api
        .post<ConfirmPaymentResponse>('/payments/confirm', {
          appointmentId,
          mercadoPagoPaymentId: mercadoPagoPaymentIdFromUrl,
        })
        .then((res) => {
          const b = res.data.booking
          if (b) {
            applyBookingFromServer(b)
            return
          }
          setError(
            'No se pudo cargar el detalle de la reserva. Recargá la página o contactá al negocio.'
          )
        })
        .catch((err) => {
          setError(err.response?.data?.error || 'No se pudo confirmar el pago')
        })
        .finally(() => setConfirming(false))
      return
    }

    api
      .post<ConfirmPaymentResponse>('/payments/confirm', {
        appointmentId,
        paymentIntentId: stored?.preferenceId,
        mercadoPagoPaymentId: mercadoPagoPaymentIdFromUrl,
      })
      .then((res) => {
        const b = res.data.booking
        if (stored) {
          setBooking(stored)
          setAppointmentForDone({
            id: stored.appointmentId,
            startTime: stored.startTime,
            endTime: stored.endTime,
            serviceName: stored.serviceName,
            cancellationToken: stored.cancellationToken || null,
          })
        } else if (b) {
          applyBookingFromServer(b)
        } else {
          setError(
            'No se pudo cargar el detalle de la reserva. Recargá la página o contactá al negocio.'
          )
        }
        sessionStorage.removeItem(MP_BOOKING_KEY)
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'No se pudo confirmar el pago')
      })
      .finally(() => setConfirming(false))
  }, [appointmentId, mercadoPagoPaymentIdFromUrl])

  if (confirming) {
    return (
      <main
        className="min-h-screen flex items-center justify-center text-neutral-300"
        style={{ backgroundColor: 'hsl(0, 0%, 9%)' }}
      >
        <p>Confirmando pago...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main
        className="min-h-screen py-12 px-4 flex items-center justify-center"
        style={{ backgroundColor: 'hsl(0, 0%, 9%)' }}
      >
        <div className="max-w-md mx-auto rounded-xl border border-neutral-700/80 bg-neutral-800/90 p-6 text-center shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-2">Error al confirmar el pago</h2>
          <p className="text-neutral-300 mb-4">{error}</p>
          <Link href="/" className="text-blue-400 underline hover:text-blue-300">
            Volver al inicio
          </Link>
        </div>
      </main>
    )
  }

  if (!booking) return null

  if (!booking || !appointmentForDone) return null

  const cancelUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/cancel?token=${booking.cancellationToken}`
      : '#'

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: 'hsl(0, 0%, 9%)' }}
    >
      <BookingDone appointment={appointmentForDone} />
      {booking.cancellationToken && (
        <p className="mt-6 max-w-md text-center text-sm text-neutral-400">
          Para cancelar:{' '}
          <a href={cancelUrl} className="text-blue-400 underline hover:text-blue-300">
            Cancelar cita
          </a>
        </p>
      )}
      <Link
        href={booking.businessSlug ? `/${booking.businessSlug}` : '/'}
        className="mt-4 text-blue-400 underline hover:text-blue-300"
      >
        Volver al negocio
      </Link>
    </main>
  )
}

