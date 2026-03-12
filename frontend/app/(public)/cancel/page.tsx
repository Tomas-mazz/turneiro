'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { api } from '@/lib/api'

type AppointmentInfo = {
  id: string
  serviceName: string
  startTime: string
  endTime: string
  status: string
  businessName: string
  employeeName: string | null
}

function formatDateTime(startTime: string, endTime: string) {
  const start = new Date(startTime)
  const end = new Date(endTime)

  const dateLabel = start.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  })

  const timeLabel = `${start.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  })} – ${end.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  })}`

  return { dateLabel, timeLabel }
}

function CancelContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'idle' | 'cancelling' | 'done' | 'error'>('loading')
  const [message, setMessage] = useState<string | null>(null)
  const [appointment, setAppointment] = useState<AppointmentInfo | null>(null)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Falta el token de cancelación.')
      return
    }

    api
      .get<AppointmentInfo>(`/appointments/by-token/${token}`)
      .then((res) => {
        if (res.data.status === 'CANCELLED') {
          setStatus('error')
          setMessage('Este turno ya fue cancelado.')
        } else {
          setAppointment(res.data)
          setStatus('idle')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('No se encontró el turno o el enlace es inválido.')
      })
  }, [token])

  const handleCancel = () => {
    setStatus('cancelling')
    setMessage(null)
    api
      .post('/appointments/cancel', { token })
      .then(() => {
        setStatus('done')
        setMessage('Turno cancelado correctamente.')
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.response?.data?.error || 'No se pudo cancelar.')
      })
  }

  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'hsl(0, 0%, 9%)' }}>
        <p className="text-neutral-400">Cargando...</p>
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'hsl(0, 0%, 9%)' }}>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center max-w-sm">
          <p className="text-red-400">{message}</p>
        </div>
      </main>
    )
  }

  if (status === 'done') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'hsl(0, 0%, 9%)' }}>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center max-w-sm">
          <p className="text-white font-medium">{message}</p>
        </div>
      </main>
    )
  }

  const { dateLabel, timeLabel } = appointment
    ? formatDateTime(appointment.startTime, appointment.endTime)
    : { dateLabel: '', timeLabel: '' }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'hsl(0, 0%, 9%)' }}>
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-sm w-full">
        <div className="border-b border-neutral-800 pb-4 mb-4">
          <p className="text-[11px] tracking-wider uppercase text-neutral-500 mb-1">
            Cancelar turno
          </p>
          <h1 className="text-xl font-semibold text-white">{appointment?.businessName}</h1>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 mb-4">
          <p className="text-[11px] tracking-wider uppercase text-neutral-500 font-semibold mb-2">
            Detalles del turno
          </p>
          <p className="text-white font-semibold mb-1">{appointment?.serviceName}</p>
          <p className="text-neutral-400 text-sm capitalize">{dateLabel}</p>
          <p className="text-neutral-400 text-sm mb-2">{timeLabel}</p>
          {appointment?.employeeName && (
            <p className="text-neutral-400 text-sm">
              Profesional: <span className="text-white">{appointment.employeeName}</span>
            </p>
          )}
        </div>

        <p className="text-neutral-400 text-sm text-center mb-4">
          ¿Estás seguro de que querés cancelar este turno? Esta acción no se puede deshacer.
        </p>

        <div className="flex gap-3 justify-center">
          <a
            href="/"
            className="px-4 py-2 rounded-full border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors text-sm font-medium"
          >
            Volver
          </a>
          <button
            type="button"
            onClick={handleCancel}
            disabled={status === 'cancelling'}
            className="px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            {status === 'cancelling' ? 'Cancelando...' : 'Cancelar turno'}
          </button>
        </div>
      </div>
    </main>
  )
}

export default function CancelPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(0, 0%, 9%)' }}>
        <p className="text-neutral-400">Cargando...</p>
      </main>
    }>
      <CancelContent />
    </Suspense>
  )
}
