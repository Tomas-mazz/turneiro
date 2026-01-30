'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const MP_BOOKING_KEY = 'mp_booking'

export default function BookingFailurePage() {
  const searchParams = useSearchParams()
  const appointmentId = searchParams.get('appointmentId')
  let businessSlug = ''
  try {
    const raw = sessionStorage.getItem(MP_BOOKING_KEY)
    if (raw) {
      const data = JSON.parse(raw) as { businessSlug?: string }
      businessSlug = data.businessSlug || ''
    }
  } catch {
    // ignore
  }

  return (
    <main className="min-h-screen bg-neutral-100 py-12 px-4 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow p-6 text-center">
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">El pago no pudo completarse</h2>
        <p className="text-neutral-600 mb-4">
          Podés intentar de nuevo o elegir otro método de pago.
        </p>
        {businessSlug ? (
          <Link href={`/${businessSlug}`} className="text-blue-600 underline">
            Volver a reservar
          </Link>
        ) : (
          <Link href="/" className="text-blue-600 underline">
            Volver al inicio
          </Link>
        )}
      </div>
    </main>
  )
}
