'use client'

import type { Step } from '../types'

type BookingStepperProps = {
  step: Step
  isDarkTheme?: boolean
  /** Permite volver a pasos anteriores; nunca se usa para adelantar. */
  onStepChange?: (next: Step) => void
}

const STEPS: { id: Step; label: string }[] = [
  { id: 'service', label: 'Elegir servicio' },
  { id: 'date', label: 'Elegir día y horario' },
  { id: 'form', label: 'Confirmá tu turno' },
]

export function BookingStepper({ step, isDarkTheme = true, onStepChange }: BookingStepperProps) {
  const activeIndex = STEPS.findIndex((s) => s.id === step)

  if (activeIndex === -1) return null

  const baseLineColor = isDarkTheme ? 'bg-neutral-700' : 'bg-neutral-200'
  const activeLineColor = isDarkTheme ? 'bg-neutral-50' : 'bg-neutral-900'
  const inactiveTextColor = isDarkTheme ? 'text-neutral-500' : 'text-neutral-500'
  const activeTextColor = isDarkTheme ? 'text-white' : 'text-neutral-900'
  const completedTextColor = isDarkTheme ? 'text-neutral-200' : 'text-neutral-800'
  const circleBorderColor = isDarkTheme ? 'border-neutral-500' : 'border-neutral-400'
  const circleCompletedBg = isDarkTheme ? 'bg-neutral-50' : 'bg-neutral-900'
  const circleCompletedBorder = isDarkTheme ? 'border-neutral-50' : 'border-neutral-900'
  const circleFutureBg = isDarkTheme ? 'bg-neutral-800' : 'bg-white'
  const circleFutureBorder = circleBorderColor

  return (
    <div className="mb-6 md:mb-8">
      <div className="relative mx-auto max-w-3xl">
        {/* Base line */}
        <div className={`absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full ${baseLineColor}`} />

        {/* Active segment con animación más lenta */}
        <div
          className={`absolute left-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full transition-all duration-700 ease-out ${activeLineColor}`}
          style={{
            width: `${(activeIndex / Math.max(1, STEPS.length - 1)) * 100}%`,
          }}
        />

        <ol className="relative z-10 flex w-full justify-between text-xs font-medium md:text-sm">
          {STEPS.map((s, index) => {
            const isActive = index === activeIndex
            const isCompleted = index < activeIndex
            const canGoBack = typeof onStepChange === 'function' && index < activeIndex

            const textClass = isCompleted
              ? completedTextColor
              : isActive
                ? activeTextColor
                : inactiveTextColor

            const basePadding = 'px-1 md:px-2'

            const circleBaseClasses =
              'mt-3 h-3.5 w-3.5 rounded-full border transition-colors duration-300 ease-out'

            const circleClasses = isCompleted
              ? `${circleBaseClasses} ${circleCompletedBg} ${circleCompletedBorder}`
              : isActive
                ? `${circleBaseClasses} bg-transparent ${circleBorderColor}`
                : `${circleBaseClasses} ${circleFutureBg} ${circleFutureBorder}`

            return (
              <li
                key={s.id}
                className="flex min-w-0 flex-2 flex-col items-center justify-start"
              >
                {canGoBack ? (
                  <button
                    type="button"
                    onClick={() => onStepChange(s.id)}
                    className={`${basePadding} inline-flex items-center justify-center rounded-sm underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 ${textClass}`}
                  >
                    <span className="truncate">{s.label}</span>
                  </button>
                ) : (
                  <span
                    className={`${basePadding} inline-flex items-center justify-center truncate ${
                      isActive ? 'font-semibold' : ''
                    } ${textClass}`}
                  >
                    {s.label}
                  </span>
                )}

                <div className={circleClasses} aria-hidden />
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}


