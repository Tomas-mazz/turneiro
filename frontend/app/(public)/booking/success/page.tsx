import { Suspense } from 'react'
import { BookingSuccessClient } from './success-client'

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-neutral-100">
          <p className="text-neutral-600">Cargando...</p>
        </main>
      }
    >
      <BookingSuccessClient />
    </Suspense>
  )
}
