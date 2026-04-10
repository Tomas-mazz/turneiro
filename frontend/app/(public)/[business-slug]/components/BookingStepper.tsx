'use client'

import type { Step } from '../types'

type BookingStepperProps = {
  step: Step
  /** Kept for API compatibility; stepper colors follow --booking-* from the layout. */
  isDarkTheme?: boolean
  showPaymentStep?: boolean
  onStepChange?: (next: Step) => void
}

const BASE_STEPS: { id: Step; label: string }[] = [
  { id: 'service', label: 'Servicio' },
  { id: 'date', label: 'Día y hora' },
  { id: 'form', label: 'Confirmar' },
]

export function BookingStepper({
  step,
  showPaymentStep = false,
  onStepChange,
}: BookingStepperProps) {
  const STEPS: { id: Step; label: string }[] = showPaymentStep
    ? [...BASE_STEPS, { id: 'payment', label: 'Pago' }]
    : BASE_STEPS
  const activeIndex = STEPS.findIndex((s) => s.id === step)
  if (activeIndex === -1) return null

  const progressPct = (activeIndex / Math.max(1, STEPS.length - 1)) * 100

  return (
    <div className="mb-5 md:mb-6">
      <div className="relative mx-auto max-w-md md:max-w-xl">
        <div
          className="absolute left-0 right-0 top-[7px] h-[2px] rounded-full bg-[color:var(--booking-stepper-track)]"
          aria-hidden
        />
        <div
          className="absolute left-0 top-[7px] h-[2px] rounded-full bg-[color:var(--booking-stepper-fill)] transition-[width] duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
          aria-hidden
        />

        <ol className="relative z-10 flex w-full justify-between gap-2">
          {STEPS.map((s, index) => {
            const isActive = index === activeIndex
            const isCompleted = index < activeIndex
            const canGoBack = typeof onStepChange === 'function' && index < activeIndex
            const text = isCompleted
              ? 'text-[color:var(--booking-stepper-done)]'
              : isActive
                ? 'text-[color:var(--booking-stepper-active)]'
                : 'text-[color:var(--booking-stepper-muted)]'

            return (
              <li key={s.id} className="flex min-w-0 flex-1 flex-col items-center">
                <span
                  className={`mb-2 block h-[14px] w-[14px] shrink-0 rounded-full border-2 transition-colors duration-300 ${
                    isCompleted
                      ? 'border-[color:var(--booking-stepper-fill)] bg-[color:var(--booking-stepper-fill)]'
                      : isActive
                        ? 'border-[color:var(--booking-stepper-fill)] bg-[color:var(--booking-stepper-dot-fill)] ring-2 ring-[color:var(--booking-stepper-dot-border-strong)] ring-offset-2 ring-offset-[color:var(--booking-stepper-ring-offset)]'
                        : 'border-[color:var(--booking-stepper-dot-border-strong)] bg-[color:var(--booking-stepper-dot-fill)]'
                  }`}
                  aria-hidden
                />
                {canGoBack ? (
                  <button
                    type="button"
                    onClick={() => onStepChange(s.id)}
                    className={`max-w-full truncate text-center text-[11px] font-medium leading-tight hover:underline md:text-xs ${text} focus:outline-none focus-visible:rounded-sm focus-visible:ring-1 focus-visible:ring-[color:var(--booking-border)]`}
                  >
                    {s.label}
                  </button>
                ) : (
                  <span
                    className={`max-w-full truncate text-center text-[11px] font-medium leading-tight md:text-xs ${
                      isActive ? 'font-semibold' : ''
                    } ${text}`}
                  >
                    {s.label}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
