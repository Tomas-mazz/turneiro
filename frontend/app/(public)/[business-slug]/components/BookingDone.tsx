'use client'

import type React from 'react'
import type { CreatedAppointment } from '../types'

type BookingDoneProps = {
  appointment: CreatedAppointment
  primaryColor: string
}

const GMAIL_WEB_URL = 'https://mail.google.com/mail/u/0/#inbox'

const isMobileDevice = () => {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

export function BookingDone({ appointment, primaryColor }: BookingDoneProps) {
  const handleOpenGmail = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isMobileDevice()) {
      // En desktop dejamos que el enlace normal a la web de Gmail funcione.
      return
    }

    event.preventDefault()

    const gmailAppUrl = 'googlegmail://'

    const fallbackTimer = window.setTimeout(() => {
      window.location.href = GMAIL_WEB_URL
    }, 800)

    window.location.href = gmailAppUrl

    window.addEventListener(
      'pagehide',
      () => {
        window.clearTimeout(fallbackTimer)
      },
      { once: true },
    )
  }

  const start = new Date(appointment.startTime)
  const end = new Date(appointment.endTime)

  const dateLabel = start.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const timeLabel = `${start.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })} – ${end.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })}`

  return (
    <div className="w-full max-w-md text-neutral-50">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/95 px-6 py-8 shadow-lg sm:px-8 sm:py-10">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15">
            <span className="text-lg text-emerald-400">✓</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-white">
            Tu turno fue agendado
          </h2>
        </div>

        <p className="mb-4 text-sm text-neutral-300 sm:text-base">
          Te enviamos un correo con la confirmación de tu turno.
        </p>

        <div className="mb-5 rounded-xl border border-neutral-800 bg-neutral-800/80 px-4 py-3 text-sm text-neutral-100">
          <p className="mb-1 font-medium">{appointment.serviceName}</p>
          <p className="capitalize">{dateLabel}</p>
          <p>{timeLabel}</p>
        </div>

        <a
          href={GMAIL_WEB_URL}
          onClick={handleOpenGmail}
          className="inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-black shadow-sm transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-200 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
          style={{ backgroundColor: primaryColor }}
        >
          Ver confirmación en Gmail
        </a>

        <p className="mt-4 text-xs leading-relaxed text-neutral-400">
          Desde ese correo vas a poder agregar el turno a tu calendario y cancelarlo cuando lo
          necesites usando el enlace de cancelación.
        </p>
      </div>
    </div>
  )
}
