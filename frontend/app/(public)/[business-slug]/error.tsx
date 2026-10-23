'use client'

import { useEffect } from 'react'

export default function BusinessError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white px-6 py-10 text-center shadow-sm">
        <h1 className="mb-3 text-2xl font-semibold text-neutral-900">Algo salió mal</h1>
        <p className="mb-6 text-sm text-neutral-600">
          No pudimos cargar la página de reservas. Probá de nuevo en unos segundos.
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Reintentar
        </button>
      </div>
    </main>
  )
}
