'use client'

import type { AuthUser } from '@/lib/auth'
import type { ServiceOption, CreatedAppointment } from '../types'
import { BookingLayout } from './BookingLayout'
import { CalendarIcon } from '@/app/_assets/icons'
import { BookingStepper } from './BookingStepper'

type ClientFormStepProps = {
  businessName: string
  logo?: string | null
  fontFamily?: string | null
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
  onSubmitAndPay?: () => void
  submitLoading: boolean
  submitError: string | null
  createdAppointment?: CreatedAppointment | null
  onContinueToPayment?: () => void
  paymentRequired?: boolean
  paymentOptionalEnabled?: boolean
  onBack?: () => void
  onBackToCalendar?: () => void
  onGoToServices: () => void
  showPaymentStep?: boolean
  primaryColor: string
  pageBackgroundColor: string
  pageBackgroundImage?: string
  isDarkTheme?: boolean
  onToggleTheme?: () => void
  onOpenLogin?: () => void
  onOpenRegister?: () => void
  user?: AuthUser | null
  onLogout?: () => void
}

export function ClientFormStep({
  businessName,
  logo,
  fontFamily = 'ROBOTO',
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
  onSubmitAndPay,
  submitLoading,
  submitError,
  createdAppointment,
  onContinueToPayment,
  paymentRequired = false,
  paymentOptionalEnabled = false,
  onBack,
  onBackToCalendar,
  onGoToServices,
  showPaymentStep = false,
  primaryColor,
  pageBackgroundColor,
  pageBackgroundImage,
  isDarkTheme = true,
  onToggleTheme,
  onOpenLogin,
  onOpenRegister,
  user = null,
  onLogout,
}: ClientFormStepProps) {
  const titleText = 'text-[color:var(--booking-fg)]'
  const subText = 'text-[color:var(--booking-fg-muted)]'
  const inputClass =
    'w-full rounded-lg border border-[color:var(--booking-input-border)] bg-[color:var(--booking-input-bg)] px-4 py-3 text-[color:var(--booking-input-text)] placeholder:text-[color:var(--booking-input-placeholder)] focus:border-[color:var(--booking-border)] focus:outline-none focus:ring-1 focus:ring-[color:var(--booking-border)]'
  const summaryCardClass =
    'border border-[color:var(--booking-card-border)] bg-[color:var(--booking-card-bg)] text-[color:var(--booking-fg)]'
  const summaryIconBg =
    'bg-[color:var(--booking-control-bg)] text-[color:var(--booking-fg)]'
  const secondaryBtnClass =
    'w-full rounded-lg border border-[color:var(--booking-secondary-btn-border)] bg-[color:var(--booking-secondary-btn-bg)] py-3 font-medium text-[color:var(--booking-fg)] hover:bg-[color:var(--booking-row-hover)]'

  if (createdAppointment && onContinueToPayment) {
    return (
      <BookingLayout
        businessName={businessName}
        logo={logo}
        isDarkTheme={isDarkTheme}
        pageBackgroundColor={pageBackgroundColor}
        pageBackgroundImage={pageBackgroundImage}
        fontFamily={fontFamily}
        onToggleTheme={onToggleTheme}
        onGoToServices={onGoToServices}
        onOpenLogin={onOpenLogin}
        onOpenRegister={onOpenRegister}
        user={user}
        onLogout={onLogout}
      >
        <BookingStepper
          step="form"
          showPaymentStep={showPaymentStep}
          onStepChange={(target) => {
            if (target === 'service') {
              onGoToServices()
            }
            if (target === 'date') {
              if (onBackToCalendar) {
                onBackToCalendar()
              } else if (onBack) {
                onBack()
              }
            }
          }}
        />
        <div className="mx-auto w-full max-w-xl md:max-w-2xl">
          <h2 className={`mb-4 min-w-0 truncate text-lg font-semibold md:mb-6 md:text-xl ${titleText}`}>
            Reserva creada
          </h2>
          <div className={`mb-6 rounded-2xl px-4 py-4 shadow-sm ${summaryCardClass}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${subText}`}>
              Resumen de tu turno
            </p>
            <p className="mt-2 text-sm text-[color:var(--booking-fg-muted)]">
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
      logo={logo}
      isDarkTheme={isDarkTheme}
      pageBackgroundColor={pageBackgroundColor}
        pageBackgroundImage={pageBackgroundImage}
      fontFamily={fontFamily}
      onToggleTheme={onToggleTheme}
      onGoToServices={onGoToServices}
      onOpenLogin={onOpenLogin}
      onOpenRegister={onOpenRegister}
      user={user}
      onLogout={onLogout}
    >
      <BookingStepper
        step="form"
        showPaymentStep={showPaymentStep}
        onStepChange={(target) => {
          if (target === 'service') {
            onGoToServices()
          }
          if (target === 'date') {
            if (onBackToCalendar) {
              onBackToCalendar()
            } else if (onBack) {
              onBack()
            }
          }
        }}
      />
      <div className="mx-auto w-full max-w-xl md:max-w-2xl">
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
            {paymentOptionalEnabled && !paymentRequired && onSubmitAndPay ? (
              <>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="w-full rounded-lg py-3 font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: primaryColor }}
                >
                  {submitLoading ? 'Reservando...' : 'Confirmar reserva gratis'}
                </button>
                <button
                  type="button"
                  disabled={submitLoading}
                  onClick={onSubmitAndPay}
                  className="w-full rounded-lg border border-[color:var(--booking-secondary-btn-border)] bg-transparent py-3 font-medium text-[color:var(--booking-fg)] transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {submitLoading ? 'Reservando...' : 'Confirmar y pagar'}
                </button>
              </>
            ) : (
              <button
                type="submit"
                disabled={submitLoading}
                className="w-full rounded-lg py-3 font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {submitLoading
                  ? 'Reservando...'
                  : paymentRequired
                    ? 'Confirmar y continuar al pago'
                    : 'Confirmar reserva'}
              </button>
            )}
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
