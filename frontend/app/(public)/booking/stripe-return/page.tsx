import { Suspense } from 'react'
import { StripeReturnClient } from './stripe-return-client'

export default function StripeReturnPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-neutral-100">
          <p className="text-neutral-600">Cargando...</p>
        </main>
      }
    >
      <StripeReturnClient />
    </Suspense>
  )
}
