'use client'

import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { api } from '@/lib/api'

function CancelContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-100 px-4">
        <p className="text-red-600">Falta el token de cancelación.</p>
      </main>
    )
  }

  const handleCancel = () => {
    setStatus('loading')
    setMessage(null)
    api
      .post('/appointments/cancel', { token })
      .then(() => {
        setStatus('done')
        setMessage('Cita cancelada correctamente.')
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.response?.data?.error || 'No se pudo cancelar.')
      })
  }

  if (status === 'done') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-100 px-4">
        <div className="bg-white rounded-xl shadow p-6 text-center max-w-sm">
          <p className="text-neutral-800 font-medium">{message}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-100 px-4">
      <div className="bg-white rounded-xl shadow p-6 max-w-sm w-full text-center">
        <h1 className="text-xl font-semibold text-neutral-900 mb-2">¿Cancelar la cita?</h1>
        <p className="text-neutral-600 text-sm mb-6">
          Esta acción no se puede deshacer.
        </p>
        {status === 'error' && message && (
          <p className="text-red-600 text-sm mb-4">{message}</p>
        )}
        <div className="flex gap-3 justify-center">
          <a
            href="/"
            className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
          >
            Volver
          </a>
          <button
            type="button"
            onClick={handleCancel}
            disabled={status === 'loading'}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {status === 'loading' ? 'Cancelando...' : 'Sí, cancelar'}
          </button>
        </div>
      </div>
    </main>
  )
}

export default function CancelPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-neutral-100">
        <p className="text-neutral-500">Cargando...</p>
      </main>
    }>
      <CancelContent />
    </Suspense>
  )
}
