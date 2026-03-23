import { Suspense } from 'react'
import { BookingSuccessClient } from './success-client'

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <main
          className="min-h-screen flex items-center justify-center text-neutral-300"
          style={{ backgroundColor: 'hsl(0, 0%, 9%)' }}
        >
          <p>Cargando...</p>
        </main>
      }
    >
      <BookingSuccessClient />
    </Suspense>
  )
}
