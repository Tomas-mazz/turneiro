'use client'

import type { AuthUser } from '@/lib/auth'
import { MercadoPagoBrick } from './MercadoPagoBrick'
import { BookingLayout } from './BookingLayout'
import { BookingStepper } from './BookingStepper'
import { CalendarIcon } from '@/app/_assets/icons'
import { MercadoPagoLogo } from './MercadoPagoLogo'
import type { CreatedAppointment } from '../types'

/** Mercado Pago brand primary (checkout buttons) */
const MERCADOPAGO_BUTTON_BG = '#009EE3'
const MERCADOPAGO_BUTTON_BG_HOVER = '#008ed6'

type PaymentStepProps = {
  businessName: string
  logo?: string | null
  fontFamily?: string | null
  createdAppointment: CreatedAppointment
  selectedDate: string
  selectedSlot: string
  paymentAmount: number | null
  paymentError: string | null
  /** When set, show Mercado Pago Checkout Brick in-page */
  mercadoPagoPreferenceId: string | null
  mercadoPagoPublicKey: string | null
  /** Where we are in the MP flow: redirect first, then fallback to brick if needed */
  mercadoPagoRedirectMode?: 'idle' | 'redirecting' | 'fallback'
  paymentLoading: boolean
  onMercadoPagoIntent: () => void
  onPaymentError: (msg: string) => void
  onMercadoPagoBack?: () => void
  onForceMercadoPagoBrick?: () => void
  onBack?: () => void
  onGoToServices: () => void
  showPaymentStep?: boolean
  primaryColor: string
  pageBackgroundColor: string
  isDarkTheme?: boolean
  onToggleTheme?: () => void
  onOpenLogin?: () => void
  onOpenRegister?: () => void
  user?: AuthUser | null
  onLogout?: () => void
}

export function PaymentStep({
  businessName,
  logo,
  fontFamily = 'ROBOTO',
  createdAppointment,
  selectedDate,
  selectedSlot,
  paymentAmount,
  paymentError,
  mercadoPagoPreferenceId,
  mercadoPagoPublicKey,
  mercadoPagoRedirectMode = 'idle',
  paymentLoading,
  onMercadoPagoIntent,
  onPaymentError,
  onMercadoPagoBack,
  onForceMercadoPagoBrick,
  onBack,
  onGoToServices,
  showPaymentStep = false,
  primaryColor,
  pageBackgroundColor,
  isDarkTheme = true,
  onToggleTheme,
  onOpenLogin,
  onOpenRegister,
  user = null,
  onLogout,
}: PaymentStepProps) {
  const showMethodButtons = mercadoPagoRedirectMode === 'idle'
  const showMercadoPagoBrick =
    mercadoPagoRedirectMode === 'fallback' && mercadoPagoPreferenceId && paymentAmount != null
  const showRedirecting = mercadoPagoRedirectMode === 'redirecting'

  const titleText = 'text-[color:var(--booking-fg)]'
  const subText = 'text-[color:var(--booking-fg-muted)]'
  const summaryCardClass =
    'border border-[color:var(--booking-card-border)] bg-[color:var(--booking-card-bg)] text-[color:var(--booking-fg)]'
  const summaryIconBg =
    'bg-[color:var(--booking-control-bg)] text-[color:var(--booking-fg)]'
  const backBtnClass =
    'bg-[color:var(--booking-control-bg)] text-[color:var(--booking-control-text)] hover:bg-[color:var(--booking-control-hover)]'
  const secondaryBtnClass =
    'w-full rounded-lg border border-[color:var(--booking-secondary-btn-border)] bg-[color:var(--booking-secondary-btn-bg)] py-3 font-medium text-[color:var(--booking-fg)] hover:bg-[color:var(--booking-row-hover)]'

  return (
    <BookingLayout
      businessName={businessName}
      logo={logo}
      isDarkTheme={isDarkTheme}
      pageBackgroundColor={pageBackgroundColor}
      fontFamily={fontFamily}
      onToggleTheme={onToggleTheme}
      onGoToServices={onGoToServices}
      onOpenLogin={onOpenLogin}
      onOpenRegister={onOpenRegister}
      user={user}
      onLogout={onLogout}
    >
      <BookingStepper
        step="payment"
        showPaymentStep={showPaymentStep}
        onStepChange={(target) => {
          if (target === 'service') onGoToServices()
          if (target === 'date' || target === 'form') onBack?.()
        }}
      />
      <div className="mx-auto w-full max-w-xl md:max-w-2xl">
        <div className="mb-4 flex min-w-0 items-center gap-3 md:mb-6 md:gap-4">
          {(onBack && showMethodButtons) || (showMercadoPagoBrick && onMercadoPagoBack) ? (
            <button
              type="button"
              onClick={showMercadoPagoBrick && onMercadoPagoBack ? onMercadoPagoBack : onBack}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${backBtnClass}`}
              aria-label={showMercadoPagoBrick ? 'Volver a opciones de pago' : 'Volver'}
            >
              ←
            </button>
          ) : null}
          <h2 className={`min-w-0 truncate text-lg font-semibold md:text-xl ${titleText}`}>
            Pago
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
                {createdAppointment.serviceName}
              </p>
              <p className={`mt-1 text-sm ${subText}`}>
                {selectedDate} · {selectedSlot}
              </p>
              {paymentAmount != null && (
                <p className={`mt-1 text-sm font-medium ${titleText}`}>
                  Monto a pagar: {paymentAmount.toFixed(2)}
                </p>
              )}
            </div>
          </div>
        </div>

        {paymentError && (
          <p className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {paymentError}
          </p>
        )}

        {showMethodButtons && (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onMercadoPagoIntent}
              disabled={paymentLoading}
              className="flex w-full items-center justify-center gap-2.5 rounded-lg px-4 py-3.5 text-[15px] font-semibold text-white shadow-md transition-colors hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                backgroundColor: MERCADOPAGO_BUTTON_BG,
              }}
              onMouseEnter={(e) => {
                if (!paymentLoading) e.currentTarget.style.backgroundColor = MERCADOPAGO_BUTTON_BG_HOVER
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = MERCADOPAGO_BUTTON_BG
              }}
              aria-label="Pagar con Mercado Pago"
            >
              {paymentLoading ? (
                'Cargando...'
              ) : (
                <>
                  <MercadoPagoLogo className="h-6 w-6 shrink-0 text-white" />
                  <span>Pagar con Mercado Pago</span>
                </>
              )}
            </button>
            {onBack && (
              <button type="button" onClick={onBack} className={secondaryBtnClass}>
                Volver
              </button>
            )}
          </div>
        )}

        {showRedirecting && (
          <div className="mb-6 rounded-2xl border border-[color:var(--booking-card-border)] bg-[color:var(--booking-card-bg)] px-4 py-4 shadow-sm">
            <p className="text-sm font-medium text-[color:var(--booking-fg)]">Abriendo Mercado Pago...</p>
            <p className="mt-1 text-xs text-[color:var(--booking-fg-muted)]">
              Si no se abre automáticamente, podés pagar con tarjeta en esta página.
            </p>
            {onForceMercadoPagoBrick && (
              <button
                type="button"
                onClick={onForceMercadoPagoBrick}
                className="mt-3 w-full rounded-lg bg-[color:var(--booking-control-bg)] py-2.5 text-sm font-medium text-[color:var(--booking-fg)] hover:bg-[color:var(--booking-control-hover)]"
              >
                Pagar con tarjeta en esta página
              </button>
            )}
          </div>
        )}

        {showMercadoPagoBrick && paymentAmount != null && (
          <MercadoPagoBrick
            publicKey={mercadoPagoPublicKey}
            preferenceId={mercadoPagoPreferenceId}
            amount={paymentAmount}
            onError={onPaymentError}
          />
        )}
      </div>
    </BookingLayout>
  )
}
