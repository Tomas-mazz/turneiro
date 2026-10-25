'use client'

import type { FormEvent } from 'react'
import { CalendarDays, Clock, User, X } from 'lucide-react'
import type { ServiceOption } from '../types'
import { serviceOptionTotalPrice } from '../utils'

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
  onSubmitAndPay: () => void
  submitLoading: boolean
  submitError: string | null
  paymentRequired: boolean
  paymentOptionalEnabled: boolean
  primaryColor: string
}

const inputClass =
  'w-full rounded-lg border border-[color:var(--booking-input-border)] bg-[color:var(--booking-input-bg)] px-4 py-3 text-[color:var(--booking-input-text)] placeholder:text-[color:var(--booking-input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[color:var(--booking-border)]'
const labelClass = 'mb-1.5 block text-sm font-medium text-[color:var(--booking-fg)]'

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
  onSubmitAndPay,
  submitLoading,
  submitError,
  paymentRequired,
  paymentOptionalEnabled,
}: BookingSummaryProps) {
  const totalPrice = services.reduce((acc, s) => acc + serviceOptionTotalPrice(s), 0)
  const totalDuration = services.reduce((acc, s) => acc + s.duration, 0)
  const ready = services.length > 0 && !!dateLabel && !!slot
  const hint =
    services.length === 0
      ? 'Elegí un servicio para empezar.'
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

      {ready && (
        <form onSubmit={onSubmit} className="flex flex-col gap-4 border-t border-[color:var(--booking-divide)] pt-5">
          <div>
            <label htmlFor="clientName" className={labelClass}>
              Nombre y apellido
            </label>
            <input
              id="clientName"
              type="text"
              autoComplete="name"
              required
              value={clientName}
              onChange={(e) => onClientName(e.target.value)}
              className={inputClass}
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label htmlFor="clientPhone" className={labelClass}>
              WhatsApp
            </label>
            <input
              id="clientPhone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              value={clientPhone}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d+]/g, '')
                onClientPhone(raw.startsWith('+') ? `+${raw.replace(/\+/g, '')}` : raw)
              }}
              className={inputClass}
              placeholder="+54 9 351 1234567"
            />
          </div>
          <div>
            <label htmlFor="clientEmail" className={labelClass}>
              Email
            </label>
            <input
              id="clientEmail"
              type="email"
              autoComplete="email"
              required
              value={clientEmail}
              onChange={(e) => onClientEmail(e.target.value)}
              className={inputClass}
              placeholder="tunombre@email.com"
            />
            <p className="mt-1.5 text-xs text-[color:var(--booking-fg-subtle)]">
              Te mandamos la confirmación y el link para cancelar.
            </p>
          </div>

          {submitError && (
            <p className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-400" role="alert">
              {submitError}
            </p>
          )}

          {paymentOptionalEnabled && !paymentRequired ? (
            <div className="flex flex-col gap-2">
              <button
                type="submit"
                disabled={submitLoading}
                className={primaryBtnClass}
              >
                {submitLoading ? 'Reservando...' : 'Reservar y pagar en el local'}
              </button>
              <button
                type="button"
                disabled={submitLoading}
                onClick={onSubmitAndPay}
                className="w-full rounded-lg border border-[color:var(--booking-secondary-btn-border)] bg-transparent py-3 font-medium text-[color:var(--booking-fg)] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {submitLoading ? 'Reservando...' : 'Reservar y pagar ahora'}
              </button>
            </div>
          ) : (
            <button
              type="submit"
              disabled={submitLoading}
              className={primaryBtnClass}
            >
              {submitLoading ? 'Reservando...' : paymentRequired ? 'Continuar al pago' : 'Confirmar reserva'}
            </button>
          )}
        </form>
      )}
    </div>
  )
}
