'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, CalendarDays, Clock, Store, Timer, User } from 'lucide-react'
import type { ServiceOption } from '../types'
import { serviceOptionTotalPrice } from '../utils'
import { ClientFields } from './ClientFields'
import { MercadoPagoBrick } from './MercadoPagoBrick'
import { MercadoPagoBadge } from './MercadoPagoLogo'

type PayChoice = 'ONLINE' | 'SHOP'
type OnlineAmount = 'DEPOSIT' | 'FULL'

type CheckoutViewProps = {
  services: ServiceOption[]
  dateLabel: string
  slot: string
  employeeName: string | null
  /** When the held slot is released (ISO); the timer counts down to it. */
  holdExpiresAt: string | null
  clientName: string
  clientEmail: string
  clientPhone: string
  onClientName: (v: string) => void
  onClientEmail: (v: string) => void
  onClientPhone: (v: string) => void
  /** Online payment is mandatory; otherwise the client can also pay at the shop. */
  paymentRequired: boolean
  /** Percentage deposit the client may pay instead of the total (required payments only). */
  depositPercentage: number | null
  submitLoading: boolean
  submitError: string | null
  onPayOnline: (amount: OnlineAmount | undefined) => void
  onPayAtShop: () => void
  /** Release the held slot and go back to pick another time. */
  onBack: () => void
  /** The hold ran out: the parent sends the client back to the booking page with a notice. */
  onExpire: () => void
  mercadoPagoRedirectMode: 'idle' | 'redirecting' | 'fallback'
  mercadoPagoPreferenceId: string | null
  mercadoPagoPublicKey: string | null
  paymentAmount: number | null
  onPaymentError: (msg: string) => void
  onForceMercadoPagoBrick: () => void
}

const cardClass =
  'rounded-2xl border border-[color:var(--booking-card-border)] bg-[color:var(--booking-card-bg)] p-4 shadow-sm md:p-5'
const optionClass = (active: boolean) =>
  `flex w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
    active
      ? 'border-[color:var(--booking-cta-bg)] bg-[color:var(--booking-control-bg)]'
      : 'border-[color:var(--booking-input-border)] hover:bg-[color:var(--booking-row-hover)]'
  }`

function formatMoney(n: number): string {
  return `$ ${Math.round(n).toLocaleString('es-AR')}`
}

/** Seconds left until `iso`, ticking every second. */
function useSecondsLeft(iso: string | null): number | null {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!iso) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [iso])
  if (!iso) return null
  return Math.max(0, Math.ceil((new Date(iso).getTime() - now) / 1000))
}

/** Checkout after picking the time: held-slot timer, the booking, the client's details and how to pay. */
export function CheckoutView({
  services,
  dateLabel,
  slot,
  employeeName,
  holdExpiresAt,
  clientName,
  clientEmail,
  clientPhone,
  onClientName,
  onClientEmail,
  onClientPhone,
  paymentRequired,
  depositPercentage,
  submitLoading,
  submitError,
  onPayOnline,
  onPayAtShop,
  onBack,
  onExpire,
  mercadoPagoRedirectMode,
  mercadoPagoPreferenceId,
  mercadoPagoPublicKey,
  paymentAmount,
  onPaymentError,
  onForceMercadoPagoBrick,
}: CheckoutViewProps) {
  const total = services.reduce((acc, s) => acc + serviceOptionTotalPrice(s), 0)
  const totalDuration = services.reduce((acc, s) => acc + s.duration, 0)
  const depositEnabled = paymentRequired && !!depositPercentage && depositPercentage > 0 && depositPercentage < 100
  const deposit = depositEnabled ? Math.round(total * (depositPercentage! / 100) * 100) / 100 : null

  const [payChoice, setPayChoice] = useState<PayChoice>(paymentRequired ? 'ONLINE' : 'SHOP')
  const [onlineAmount, setOnlineAmount] = useState<OnlineAmount>(depositEnabled ? 'DEPOSIT' : 'FULL')

  const secondsLeft = useSecondsLeft(holdExpiresAt)
  const expired = secondsLeft === 0
  const timerLabel =
    secondsLeft == null
      ? null
      : `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`
  const inPaymentFlow = mercadoPagoRedirectMode !== 'idle'

  // Out of time while still filling in the details: leave the checkout on our own (once).
  const expiredHandledRef = useRef(false)
  useEffect(() => {
    if (!expired || inPaymentFlow || expiredHandledRef.current) return
    expiredHandledRef.current = true
    onExpire()
  }, [expired, inPaymentFlow, onExpire])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (payChoice === 'SHOP') onPayAtShop()
    else onPayOnline(depositEnabled ? onlineAmount : undefined)
  }

  const payNowAmount = depositEnabled && onlineAmount === 'DEPOSIT' ? deposit! : total

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-12 pt-6 md:px-6">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[color:var(--booking-fg-muted)] hover:text-[color:var(--booking-fg)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Cambiar horario
      </button>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        <section className={`${cardClass} lg:sticky lg:top-6`} aria-labelledby="checkout-summary-title">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="checkout-summary-title" className="text-lg font-semibold text-[color:var(--booking-fg)]">
              Tu reserva
            </h2>
            {timerLabel && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3.5 py-1.5 text-base font-bold tabular-nums text-white shadow-md shadow-red-600/30 ${
                  secondsLeft! <= 60 ? 'animate-pulse' : ''
                }`}
                role="timer"
                aria-label={`Tiempo para confirmar: ${timerLabel}`}
              >
                <Timer className="h-5 w-5" aria-hidden />
                {timerLabel}
              </span>
            )}
          </div>

          <ul className="space-y-2">
            {services.map((s) => (
              <li key={`${s.id}:${s.parentServiceId ?? 'root'}`} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-[color:var(--booking-fg)]">{s.name}</p>
                  <p className="text-sm text-[color:var(--booking-fg-muted)]">{s.duration} min</p>
                  {s.addOns && s.addOns.length > 0 && (
                    <ul className="mt-0.5 text-xs text-[color:var(--booking-fg-muted)]">
                      {s.addOns.map((a) => (
                        <li key={a.id}>+ {a.name}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <span className="shrink-0 font-semibold text-[color:var(--booking-fg)]">
                  {formatMoney(serviceOptionTotalPrice(s))}
                </span>
              </li>
            ))}
          </ul>

          <ul className="mt-4 space-y-1.5 border-t border-[color:var(--booking-divide)] pt-4 text-sm text-[color:var(--booking-fg-muted)]">
            <li className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
              <span className="inline-block first-letter:uppercase">{dateLabel}</span>
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0" aria-hidden />
              {slot} hs · {totalDuration} min
            </li>
            {employeeName && (
              <li className="flex items-center gap-2">
                <User className="h-4 w-4 shrink-0" aria-hidden />
                Con {employeeName}
              </li>
            )}
          </ul>

          <p className="mt-4 flex justify-between border-t border-[color:var(--booking-divide)] pt-4 text-base font-semibold text-[color:var(--booking-fg)]">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </p>
          <p className="mt-3 text-xs text-[color:var(--booking-fg-subtle)]">
            Te guardamos este horario mientras corre el tiempo.
          </p>
        </section>

        <section className={cardClass} aria-labelledby="checkout-form-title">
          {mercadoPagoRedirectMode === 'redirecting' ? (
            <div className="py-6 text-center">
              <h2 id="checkout-form-title" className="text-lg font-semibold text-[color:var(--booking-fg)]">
                Abriendo Mercado Pago...
              </h2>
              <p className="mt-2 text-sm text-[color:var(--booking-fg-muted)]">
                Si no se abre automáticamente, podés pagar con tarjeta acá mismo.
              </p>
              <button
                type="button"
                onClick={onForceMercadoPagoBrick}
                className="mt-5 w-full rounded-lg bg-[color:var(--booking-control-bg)] py-2.5 text-sm font-medium text-[color:var(--booking-fg)] hover:bg-[color:var(--booking-control-hover)]"
              >
                Pagar con tarjeta en esta página
              </button>
            </div>
          ) : mercadoPagoRedirectMode === 'fallback' && mercadoPagoPreferenceId && paymentAmount != null ? (
            <div>
              <h2 id="checkout-form-title" className="mb-4 text-lg font-semibold text-[color:var(--booking-fg)]">
                Pagá {formatMoney(paymentAmount)}
              </h2>
              {submitError && (
                <p className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-400" role="alert">
                  {submitError}
                </p>
              )}
              <MercadoPagoBrick
                publicKey={mercadoPagoPublicKey}
                preferenceId={mercadoPagoPreferenceId}
                amount={paymentAmount}
                onError={onPaymentError}
              />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <h2 id="checkout-form-title" className="text-lg font-semibold text-[color:var(--booking-fg)]">
                Completá tus datos
              </h2>
              <ClientFields
                clientName={clientName}
                clientEmail={clientEmail}
                clientPhone={clientPhone}
                onClientName={onClientName}
                onClientEmail={onClientEmail}
                onClientPhone={onClientPhone}
              />

              <fieldset className="mt-2 flex flex-col gap-2">
                <legend className="mb-2 text-sm font-semibold text-[color:var(--booking-fg)]">
                  {paymentRequired ? 'Pago para confirmar el turno' : '¿Cómo querés pagar?'}
                </legend>
                {!paymentRequired && (
                  <label className={optionClass(payChoice === 'SHOP')}>
                    <input
                      type="radio"
                      name="payChoice"
                      className="sr-only"
                      checked={payChoice === 'SHOP'}
                      onChange={() => setPayChoice('SHOP')}
                    />
                    <Store className="h-5 w-5 shrink-0 text-[color:var(--booking-fg-muted)]" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-[color:var(--booking-fg)]">Pagar en el local</span>
                      <span className="block text-xs text-[color:var(--booking-fg-muted)]">El día del turno</span>
                    </span>
                    <span className="text-sm font-semibold text-[color:var(--booking-fg)]">{formatMoney(total)}</span>
                  </label>
                )}
                {depositEnabled ? (
                  (['DEPOSIT', 'FULL'] as const).map((amount) => (
                    <label key={amount} className={optionClass(payChoice === 'ONLINE' && onlineAmount === amount)}>
                      <input
                        type="radio"
                        name="payChoice"
                        className="sr-only"
                        checked={payChoice === 'ONLINE' && onlineAmount === amount}
                        onChange={() => {
                          setPayChoice('ONLINE')
                          setOnlineAmount(amount)
                        }}
                      />
                      <MercadoPagoBadge />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-[color:var(--booking-fg)]">
                          {amount === 'DEPOSIT' ? `Pagar seña (${depositPercentage}%)` : 'Pagar el total'}
                        </span>
                        <span className="block text-xs text-[color:var(--booking-fg-muted)]">
                          {amount === 'DEPOSIT' ? 'El resto lo pagás en el local' : 'Con Mercado Pago'}
                        </span>
                      </span>
                      <span className="text-sm font-semibold text-[color:var(--booking-fg)]">
                        {formatMoney(amount === 'DEPOSIT' ? deposit! : total)}
                      </span>
                    </label>
                  ))
                ) : (
                  <label className={optionClass(payChoice === 'ONLINE')}>
                    <input
                      type="radio"
                      name="payChoice"
                      className="sr-only"
                      checked={payChoice === 'ONLINE'}
                      onChange={() => setPayChoice('ONLINE')}
                    />
                    <MercadoPagoBadge />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-[color:var(--booking-fg)]">Pagar ahora</span>
                      <span className="block text-xs text-[color:var(--booking-fg-muted)]">Con Mercado Pago</span>
                    </span>
                    <span className="text-sm font-semibold text-[color:var(--booking-fg)]">{formatMoney(total)}</span>
                  </label>
                )}
              </fieldset>

              {submitError && (
                <p className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-400" role="alert">
                  {submitError}
                </p>
              )}

              {payChoice === 'ONLINE' ? (
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-[#009EE3] py-3.5 font-semibold text-white shadow-sm transition-colors hover:bg-[#008ed6] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitLoading ? (
                    'Cargando...'
                  ) : (
                    <>
                      <MercadoPagoBadge />
                      Reservar y pagar con Mercado Pago
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="w-full rounded-lg bg-[color:var(--booking-cta-bg)] py-3.5 font-semibold text-[color:var(--booking-cta-fg)] shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitLoading ? 'Reservando...' : 'Reservar'}
                </button>
              )}
              <p className="-mt-1 text-center text-xs text-[color:var(--booking-fg-subtle)]">
                {payChoice === 'ONLINE'
                  ? `Vas a pagar ${formatMoney(payNowAmount)} en Mercado Pago. Tu turno queda reservado cuando se acredita el pago.`
                  : `Pagás ${formatMoney(total)} en el local el día del turno.`}
              </p>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
