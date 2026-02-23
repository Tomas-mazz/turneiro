'use client'

import type { ServiceOption, CreatedAppointment } from '../types'

type ClientFormStepProps = {
  selectedService: ServiceOption
  selectedDate: string
  selectedSlot: string
  clientName: string
  clientPhone: string
  onClientName: (v: string) => void
  onClientPhone: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  submitLoading: boolean
  submitError: string | null
  createdAppointment?: CreatedAppointment | null
  onContinueToPayment?: () => void
  onBack?: () => void
  onBackToCalendar?: () => void
  primaryColor: string
  isDarkTheme?: boolean
  onToggleTheme?: () => void
}

export function ClientFormStep({
  selectedService,
  selectedDate,
  selectedSlot,
  clientName,
  clientPhone,
  onClientName,
  onClientPhone,
  onSubmit,
  submitLoading,
  submitError,
  createdAppointment,
  onContinueToPayment,
  onBack,
  onBackToCalendar,
  primaryColor,
  isDarkTheme = true,
  onToggleTheme,
}: ClientFormStepProps) {
  const summary = `${selectedService.name} · ${selectedDate} · ${selectedSlot}`

  const bgColor = isDarkTheme ? 'hsl(0, 0%, 9%)' : 'rgb(244, 244, 245)'
  const sectionText = isDarkTheme ? 'text-white' : 'text-neutral-900'
  const headerBorder = isDarkTheme ? 'border-neutral-600' : 'border-neutral-300'
  const backBtnClass = isDarkTheme
    ? 'bg-neutral-700/80 text-white hover:bg-neutral-600'
    : 'border border-neutral-300 bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
  const titleText = isDarkTheme ? 'text-white' : 'text-neutral-800'
  const subText = isDarkTheme ? 'text-neutral-400' : 'text-neutral-600'
  const inputClass = isDarkTheme
    ? 'w-full rounded-lg border border-neutral-600 bg-neutral-700/80 px-4 py-3 text-white placeholder-neutral-500 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500'
    : 'w-full rounded-lg border border-neutral-400 bg-white px-4 py-3 text-neutral-800 placeholder-neutral-400 focus:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600'
  const summaryCardClass = isDarkTheme
    ? 'rounded-xl border border-neutral-600 bg-neutral-700/80 px-4 py-3 text-neutral-200'
    : 'rounded-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-700'
  const secondaryBtnClass = isDarkTheme
    ? 'w-full rounded-lg border border-neutral-500 bg-neutral-700/80 py-3 font-medium text-white hover:bg-neutral-600'
    : 'w-full rounded-lg border border-neutral-400 bg-transparent py-3 font-medium text-neutral-800 hover:bg-neutral-100'

  if (createdAppointment && onContinueToPayment) {
    return (
      <section
        className={`min-h-screen transition-colors duration-300 ease-out ${sectionText}`}
        style={{ backgroundColor: bgColor }}
      >
        <header className={`border-b py-4 md:py-5 ${headerBorder}`}>
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 md:px-6 lg:px-8">
            <h1 className={`min-w-0 truncate text-lg font-semibold md:text-xl ${titleText}`}>
              Reserva creada
            </h1>
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 transition-all duration-300 ease-out sm:h-11 sm:w-11 ${
                  isDarkTheme
                    ? 'border-lime-300 bg-neutral-900 text-neutral-100 hover:border-lime-200'
                    : 'border-indigo-500 bg-white text-neutral-600 hover:border-indigo-400'
                }`}
                aria-label={isDarkTheme ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                title={isDarkTheme ? 'Modo oscuro' : 'Modo claro'}
              >
                {isDarkTheme ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
                    <path d="M17.5 4.5v2M17.5 9.5v2M15 7h2M20 7h2" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-8 lg:px-8">
          <div className={`mb-6 rounded-xl border px-4 py-4 ${summaryCardClass}`}>
            <p className={`text-sm ${subText}`}>{summary}</p>
            <p className="mt-2 text-sm">
              Tu reserva está lista. Completá el pago para confirmar.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onContinueToPayment}
              className="w-full rounded-lg py-3 font-medium text-black transition-opacity hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              Continuar al pago
            </button>
            {onBackToCalendar && (
              <button
                type="button"
                onClick={onBackToCalendar}
                className={secondaryBtnClass}
              >
                Volver al calendario
              </button>
            )}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      className={`min-h-screen transition-colors duration-300 ease-out ${sectionText}`}
      style={{ backgroundColor: bgColor }}
    >
      <header className={`border-b py-4 md:py-5 ${headerBorder}`}>
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 md:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3 md:gap-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${backBtnClass}`}
                aria-label="Volver"
              >
                ←
              </button>
            )}
            <h1 className={`min-w-0 truncate text-lg font-semibold md:text-xl ${titleText}`}>
              Tus datos
            </h1>
          </div>
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 transition-all duration-300 ease-out sm:h-11 sm:w-11 ${
                isDarkTheme
                  ? 'border-lime-300 bg-neutral-900 text-neutral-100 hover:border-lime-200'
                  : 'border-indigo-500 bg-white text-neutral-600 hover:border-indigo-400'
              }`}
              aria-label={isDarkTheme ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title={isDarkTheme ? 'Modo oscuro' : 'Modo claro'}
            >
              {isDarkTheme ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
                  <path d="M17.5 4.5v2M17.5 9.5v2M15 7h2M20 7h2" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
                </svg>
              )}
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-8 lg:px-8">
        <div className={`mb-6 rounded-xl border px-4 py-3 ${summaryCardClass}`}>
          <p className="text-sm font-medium">{summary}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label htmlFor="clientName" className={`mb-2 block text-sm font-medium ${titleText}`}>
              Nombre completo
            </label>
            <input
              id="clientName"
              type="text"
              required
              value={clientName}
              onChange={(e) => onClientName(e.target.value)}
              className={inputClass}
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label htmlFor="clientPhone" className={`mb-2 block text-sm font-medium ${titleText}`}>
              Teléfono
            </label>
            <input
              id="clientPhone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              required
              value={clientPhone}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d+]/g, '')
                const hasLeadingPlus = raw.startsWith('+')
                const digitsOnly = raw.replace(/\+/g, '')
                onClientPhone(hasLeadingPlus ? `+${digitsOnly}` : digitsOnly)
              }}
              className={inputClass}
              placeholder="+54 11 12345678"
            />
          </div>
          <p className={`text-xs ${subText}`}>
            Estos datos son obligatorios para la confirmación, recordatorios y el enlace para cancelar.
          </p>
          {submitError && (
            <p className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {submitError}
            </p>
          )}
          <div className="flex flex-col gap-3 pt-2">
            <button
              type="submit"
              disabled={submitLoading}
              className="w-full rounded-lg py-3 font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {submitLoading ? 'Reservando...' : 'Confirmar reserva'}
            </button>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className={secondaryBtnClass}
              >
                Volver
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  )
}
