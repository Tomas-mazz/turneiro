'use client'

import type { CreatedAppointment } from '../types'

type BookingDoneProps = {
  appointment: CreatedAppointment
  primaryColor: string
}

export function BookingDone({ appointment, primaryColor }: BookingDoneProps) {
  const cancelUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/cancel?token=${appointment.cancellationToken}`
      : '#'

  return (
    <main className="min-h-screen bg-neutral-100 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow p-6 text-center">
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">Cita confirmada</h2>
        <p className="text-neutral-600 mb-1">{appointment.serviceName}</p>
        <p className="text-neutral-600 text-sm">
          {new Date(appointment.startTime).toLocaleString('es')} –{' '}
          {new Date(appointment.endTime).toLocaleTimeString('es', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
        {appointment.cancellationToken && (
          <p className="mt-4 text-sm text-neutral-500">
            Para cancelar, usa este enlace:{' '}
            <a href={cancelUrl} className="underline" style={{ color: primaryColor }}>
              Cancelar cita
            </a>
          </p>
        )}
      </div>
    </main>
  )
}
