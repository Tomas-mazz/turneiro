'use client'

import Link from 'next/link'

const MP_BOOKING_KEY = 'mp_booking'

export default function BookingPendingPage() {
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
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">Pago pendiente</h2>
        <p className="text-neutral-600 mb-4">
          Tu pago está en proceso. Te avisaremos cuando se confirme.
        </p>
        {businessSlug ? (
          <Link href={`/${businessSlug}`} className="text-blue-600 underline">
            Volver al negocio
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
