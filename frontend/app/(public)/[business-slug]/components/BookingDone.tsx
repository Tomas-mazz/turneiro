'use client'

import type { CreatedAppointment } from '../types'

type BookingDoneProps = {
  appointment: CreatedAppointment
  primaryColor: string
  businessName?: string
  businessAddress?: string | null
}

const BOOKING_TIME_ZONE = 'America/Argentina/Buenos_Aires'

/** Google Calendar expects UTC timestamps as YYYYMMDDTHHMMSSZ. */
const toGoogleCalendarDate = (date: Date) =>
  date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

const buildGoogleCalendarUrl = (
  appointment: CreatedAppointment,
  businessName?: string,
  businessAddress?: string | null,
) => {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: businessName ? `${appointment.serviceName} · ${businessName}` : appointment.serviceName,
    dates: `${toGoogleCalendarDate(new Date(appointment.startTime))}/${toGoogleCalendarDate(
      new Date(appointment.endTime),
    )}`,
  })
  if (businessAddress) params.set('location', businessAddress)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function BookingDone({
  appointment,
  primaryColor,
  businessName,
  businessAddress,
}: BookingDoneProps) {
  const start = new Date(appointment.startTime)
  const end = new Date(appointment.endTime)

  const dateLabel = start.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: BOOKING_TIME_ZONE,
  })

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: BOOKING_TIME_ZONE,
  }
  const timeLabel = `${start.toLocaleTimeString('es-AR', timeOptions)} – ${end.toLocaleTimeString(
    'es-AR',
    timeOptions,
  )}`

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
          Te enviamos un correo con la confirmación de tu turno. Si no lo ves, revisá la carpeta de
          spam.
        </p>

        <div className="mb-5 rounded-xl border border-neutral-800 bg-neutral-800/80 px-4 py-3 text-sm text-neutral-100">
          <p className="mb-1 font-medium">{appointment.serviceName}</p>
          <p className="capitalize">{dateLabel}</p>
          <p>{timeLabel}</p>
        </div>

        <a
          href={buildGoogleCalendarUrl(appointment, businessName, businessAddress)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-black shadow-sm transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-200 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
          style={{ backgroundColor: primaryColor }}
        >
          Agregar a Google Calendar
        </a>

        <p className="mt-4 text-xs leading-relaxed text-neutral-400">
          En el correo de confirmación tenés el enlace para cancelar el turno si lo necesitás.
        </p>
      </div>
    </div>
  )
}
