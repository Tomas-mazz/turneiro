'use client'

import type { Step } from '../types'

type BookingStepperProps = {
  step: Step
  isDarkTheme?: boolean
  onStepChange?: (next: Step) => void
}

const STEPS: { id: Step; label: string }[] = [
  { id: 'service', label: 'Servicio' },
  { id: 'date', label: 'Día y hora' },
  { id: 'form', label: 'Confirmar' },
  { id: 'payment', label: 'Pago' },
]

export function BookingStepper({ step, isDarkTheme = true, onStepChange }: BookingStepperProps) {
  const activeIndex = STEPS.findIndex((s) => s.id === step)
  if (activeIndex === -1) return null

  const progressPct = (activeIndex / Math.max(1, STEPS.length - 1)) * 100

  const track = isDarkTheme ? 'bg-neutral-700/80' : 'bg-neutral-200'
  const fill = isDarkTheme ? 'bg-neutral-200' : 'bg-neutral-800'
  const muted = isDarkTheme ? 'text-neutral-500' : 'text-neutral-500'
  const active = isDarkTheme ? 'text-neutral-100' : 'text-neutral-900'
  const done = isDarkTheme ? 'text-neutral-400' : 'text-neutral-600'

  return (
    <div className="mb-5 md:mb-6">
      <div className="relative mx-auto max-w-md md:max-w-xl">
        {/* Línea base */}
        <div
          className={`absolute left-0 right-0 top-[7px] h-[2px] rounded-full ${track}`}
          aria-hidden
        />
        <div
          className={`absolute left-0 top-[7px] h-[2px] rounded-full transition-[width] duration-500 ease-out ${fill}`}
          style={{ width: `${progressPct}%` }}
          aria-hidden
        />

        <ol className="relative z-10 flex w-full justify-between gap-2">
          {STEPS.map((s, index) => {
            const isActive = index === activeIndex
            const isCompleted = index < activeIndex
            const canGoBack = typeof onStepChange === 'function' && index < activeIndex
            const text = isCompleted ? done : isActive ? active : muted

            return (
              <li key={s.id} className="flex min-w-0 flex-1 flex-col items-center">
                <span
                  className={`mb-2 block h-[14px] w-[14px] shrink-0 rounded-full border-2 transition-colors duration-300 ${
                    isCompleted
                      ? isDarkTheme
                        ? 'border-neutral-300 bg-neutral-300'
                        : 'border-neutral-700 bg-neutral-700'
                      : isActive
                        ? isDarkTheme
                          ? 'border-neutral-200 bg-[hsl(0,0%,9%)] ring-2 ring-neutral-600 ring-offset-2 ring-offset-[hsl(0,0%,9%)]'
                          : 'border-neutral-800 bg-white ring-2 ring-neutral-200 ring-offset-2 ring-offset-[rgb(244,244,245)]'
                        : isDarkTheme
                          ? 'border-neutral-600 bg-[hsl(0,0%,9%)]'
                          : 'border-neutral-300 bg-white'
                  }`}
                  aria-hidden
                />
                {canGoBack ? (
                  <button
                    type="button"
                    onClick={() => onStepChange(s.id)}
                    className={`max-w-full truncate text-center text-[11px] font-medium leading-tight hover:underline md:text-xs ${text} focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500 rounded-sm`}
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
