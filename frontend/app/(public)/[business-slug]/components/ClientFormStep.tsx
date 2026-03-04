'use client'

import type { ServiceOption, CreatedAppointment } from '../types'
import { BookingLayout } from './BookingLayout'
import { CalendarIcon } from '@/app/_assets/icons'

type ClientFormStepProps = {
  businessName: string
  selectedService: ServiceOption
  selectedDate: string
  selectedSlot: string
  clientName: string
  clientEmail: string
  clientPhone: string
  onClientName: (v: string) => void
  onClientEmail: (v: string) => void
  onClientPhone: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  submitLoading: boolean
  submitError: string | null
  createdAppointment?: CreatedAppointment | null
  onContinueToPayment?: () => void
  onBack?: () => void
  onBackToCalendar?: () => void
  onGoToServices: () => void
  primaryColor: string
  isDarkTheme?: boolean
  onToggleTheme?: () => void
}

export function ClientFormStep({
  businessName,
  selectedService,
  selectedDate,
  selectedSlot,
  clientName,
  clientEmail,
  clientPhone,
  onClientName,
  onClientEmail,
  onClientPhone,
  onSubmit,
  submitLoading,
  submitError,
  createdAppointment,
  onContinueToPayment,
  onBack,
  onBackToCalendar,
  onGoToServices,
  primaryColor,
  isDarkTheme = true,
  onToggleTheme,
}: ClientFormStepProps) {
  const backBtnClass = isDarkTheme
    ? 'bg-neutral-700/80 text-white hover:bg-neutral-600'
    : 'border border-neutral-300 bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
  const titleText = isDarkTheme ? 'text-white' : 'text-neutral-800'
  const subText = isDarkTheme ? 'text-neutral-400' : 'text-neutral-600'
  const inputClass = isDarkTheme
    ? 'w-full rounded-lg border border-neutral-600 bg-neutral-700/80 px-4 py-3 text-white placeholder-neutral-500 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500'
    : 'w-full rounded-lg border border-neutral-400 bg-white px-4 py-3 text-neutral-800 placeholder-neutral-400 focus:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600'
  const summaryCardClass = isDarkTheme
    ? 'border border-neutral-700/80 bg-neutral-800/80 text-neutral-100'
    : 'border border-neutral-200 bg-white text-neutral-900'
  const summaryIconBg = isDarkTheme ? 'bg-neutral-700 text-neutral-100' : 'bg-neutral-900 text-white'
  const secondaryBtnClass = isDarkTheme
    ? 'w-full rounded-lg border border-neutral-500 bg-neutral-700/80 py-3 font-medium text-white hover:bg-neutral-600'
    : 'w-full rounded-lg border border-neutral-400 bg-transparent py-3 font-medium text-neutral-800 hover:bg-neutral-100'

  if (createdAppointment && onContinueToPayment) {
    return (
      <BookingLayout
        businessName={businessName}
        isDarkTheme={isDarkTheme}
        onToggleTheme={onToggleTheme}
        onGoToServices={onGoToServices}
      >
        <div className="mx-auto w-full max-w-xl md:max-w-2xl">
          <h2 className={`mb-4 min-w-0 truncate text-lg font-semibold md:mb-6 md:text-xl ${titleText}`}>
            Reserva creada
          </h2>
          <div className={`mb-6 rounded-2xl px-4 py-4 shadow-sm ${summaryCardClass}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${subText}`}>
              Resumen de tu turno
            </p>
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
      </BookingLayout>
    )
  }

  return (
    <BookingLayout
      businessName={businessName}
      isDarkTheme={isDarkTheme}
      onToggleTheme={onToggleTheme}
      onGoToServices={onGoToServices}
    >
      <div className="mx-auto w-full max-w-xl md:max-w-2xl">
        <div className="mb-4 flex min-w-0 items-center gap-3 md:mb-6 md:gap-4">
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
          <h2 className={`min-w-0 truncate text-lg font-semibold md:text-xl ${titleText}`}>
            Tus datos
          </h2>
        </div>
        <div className={`mb-6 rounded-2xl px-4 py-4 shadow-sm ${summaryCardClass}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${subText}`}>
            Resumen de tu turno
          </p>
          <div className="mt-3 flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${summaryIconBg}`}
              aria-hidden
            >
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className={`truncate text-sm font-semibold ${titleText}`}>
                {selectedService.name}
              </p>
              <p className={`mt-1 text-sm ${subText}`}>
                {selectedDate} · {selectedSlot}
              </p>
            </div>
          </div>
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
            <label htmlFor="clientEmail" className={`mb-2 block text-sm font-medium ${titleText}`}>
              Gmail
            </label>
            <input
              id="clientEmail"
              type="email"
              required
              value={clientEmail}
              onChange={(e) => onClientEmail(e.target.value)}
              className={inputClass}
              placeholder="tuusuario@gmail.com"
              pattern="^[a-zA-Z0-9._%+-]+@gmail\\.com$"
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
    </BookingLayout>
  )
}
