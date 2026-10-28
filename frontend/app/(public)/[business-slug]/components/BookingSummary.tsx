'use client'

import type { FormEvent } from 'react'
import { CalendarDays, Clock, User, X } from 'lucide-react'
import type { ServiceOption } from '../types'
import { serviceOptionTotalPrice } from '../utils'
import { ClientFields } from './ClientFields'

type BookingSummaryProps = {
  services: ServiceOption[]
  onRemoveService?: (service: ServiceOption) => void
  dateLabel: string | null
  slot: string | null
  employeeName: string | null
  clientName: string
  clientEmail: string
  clientPhone: string
  onClientName: (v: string) => void
  onClientEmail: (v: string) => void
  onClientPhone: (v: string) => void
  onSubmit: (e: FormEvent) => void
  /** Set when the business takes payments: the details and payment are filled in on the checkout screen. */
  onContinueToCheckout?: () => void
  submitLoading: boolean
  submitError: string | null
  /** The business has a team and no professional was chosen yet (first step). */
  employeeMissing?: boolean
}

/** "Tu reserva": what was picked, the client's details and the confirm button(s). */
export function BookingSummary({
  services,
  onRemoveService,
  dateLabel,
  slot,
  employeeName,
  clientName,
  clientEmail,
  clientPhone,
  onClientName,
  onClientEmail,
  onClientPhone,
  onSubmit,
  onContinueToCheckout,
  submitLoading,
  submitError,
  employeeMissing = false,
}: BookingSummaryProps) {
  const totalPrice = services.reduce((acc, s) => acc + serviceOptionTotalPrice(s), 0)
  const totalDuration = services.reduce((acc, s) => acc + s.duration, 0)
  const ready = !employeeMissing && services.length > 0 && !!dateLabel && !!slot
  const hint = employeeMissing
    ? 'Elegí un profesional para empezar.'
    : services.length === 0
      ? 'Elegí un servicio.'
      : !dateLabel || !slot
        ? 'Elegí el día y el horario.'
        : null

  const primaryBtnClass =
    'w-full rounded-lg bg-[color:var(--booking-cta-bg)] py-3 font-semibold text-[color:var(--booking-cta-fg)] shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <div className="flex flex-col gap-5">
      {services.length > 0 && (
        <ul className="space-y-2">
          {services.map((s) => (
            <li key={`${s.id}:${s.parentServiceId ?? 'root'}`} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-[color:var(--booking-fg)]">{s.name}</p>
                <p className="text-sm text-[color:var(--booking-fg-muted)]">{s.duration} min</p>
                {s.addOns && s.addOns.length > 0 && (
                  <ul className="mt-0.5 text-xs text-[color:var(--booking-fg-muted)]">
                    {s.addOns.map((a) => (
                      <li key={a.id}>
                        + {a.name} ($ {a.price.toFixed(0)})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-semibold text-[color:var(--booking-fg)]">
                  $ {serviceOptionTotalPrice(s).toFixed(0)}
                </span>
                {onRemoveService && (
                  <button
                    type="button"
                    onClick={() => onRemoveService(s)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[color:var(--booking-fg-muted)] hover:bg-[color:var(--booking-control-hover)]"
                    aria-label={`Quitar ${s.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
          {services.length > 1 && (
            <li className="flex justify-between border-t border-[color:var(--booking-divide)] pt-2 font-semibold text-[color:var(--booking-fg)]">
              <span>Total ({totalDuration} min)</span>
              <span>$ {totalPrice.toFixed(0)}</span>
            </li>
          )}
        </ul>
      )}

      {(dateLabel || employeeName) && (
        <ul className="space-y-1.5 text-sm text-[color:var(--booking-fg-muted)]">
          {dateLabel && (
            <li className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
              <span className="inline-block first-letter:uppercase">{dateLabel}</span>
            </li>
          )}
          {slot && (
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0" aria-hidden />
              {slot} hs
            </li>
          )}
          {employeeName && (
            <li className="flex items-center gap-2">
              <User className="h-4 w-4 shrink-0" aria-hidden />
              Con {employeeName}
            </li>
          )}
        </ul>
      )}

      {hint && <p className="text-sm text-[color:var(--booking-fg-muted)]">{hint}</p>}

      {ready && onContinueToCheckout && (
        <div className="flex flex-col gap-3 border-t border-[color:var(--booking-divide)] pt-5">
          {submitError && (
            <p className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-400" role="alert">
              {submitError}
            </p>
          )}
          <button type="button" onClick={onContinueToCheckout} disabled={submitLoading} className={primaryBtnClass}>
            {submitLoading ? 'Reservando horario...' : 'Continuar'}
          </button>
          <p className="text-center text-xs text-[color:var(--booking-fg-subtle)]">
            Te guardamos el horario unos minutos para completar tus datos y el pago.
          </p>
        </div>
      )}

      {ready && !onContinueToCheckout && (
        <form onSubmit={onSubmit} className="flex flex-col gap-4 border-t border-[color:var(--booking-divide)] pt-5">
          <ClientFields
            clientName={clientName}
            clientEmail={clientEmail}
            clientPhone={clientPhone}
            onClientName={onClientName}
            onClientEmail={onClientEmail}
            onClientPhone={onClientPhone}
          />

          {submitError && (
            <p className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-400" role="alert">
              {submitError}
            </p>
          )}

          <button type="submit" disabled={submitLoading} className={primaryBtnClass}>
            {submitLoading ? 'Reservando...' : 'Confirmar reserva'}
          </button>
        </form>
      )}
    </div>
  )
}
