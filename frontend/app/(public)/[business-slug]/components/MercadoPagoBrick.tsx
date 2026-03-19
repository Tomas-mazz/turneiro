'use client'

import { useEffect, useState } from 'react'
import { initMercadoPago, Payment } from '@mercadopago/sdk-react'

type MercadoPagoBrickProps = {
  publicKey: string | null
  preferenceId: string
  amount: number
  onReady?: () => void
  onError?: (message: string) => void
}

/**
 * Renders Mercado Pago Checkout Bricks Payment Brick in-page.
 * Requires NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY and a preference created by the backend.
 * On successful payment, Mercado Pago redirects to the success URL set in the preference.
 */
export function MercadoPagoBrick({
  publicKey,
  preferenceId,
  amount,
  onReady,
  onError,
}: MercadoPagoBrickProps) {
  const [sdkReady, setSdkReady] = useState(false)

  useEffect(() => {
    if (!publicKey) {
      onError?.('Mercado Pago no está configurado (falta clave pública).')
      return
    }
    try {
      initMercadoPago(publicKey)
      // SDK init is synchronous; allow one tick for scripts to load
      const t = setTimeout(() => setSdkReady(true), 100)
      return () => clearTimeout(t)
    } catch {
      onError?.('No se pudo cargar Mercado Pago.')
    }
  }, [onError, publicKey])

  if (!publicKey || !sdkReady) {
    return (
      <div className="py-6 text-center text-neutral-600">
        Cargando formulario de pago...
      </div>
    )
  }

  return (
    <div className="mercadopago-brick-wrapper">
      <Payment
        initialization={{
          amount: Math.round(amount * 100) / 100,
          preferenceId,
        }}
        customization={{
          paymentMethods: {
            creditCard: 'all',
          },
        }}
        onReady={() => onReady?.()}
        onSubmit={async () => {
          // With preference-based flow, MP processes the payment and redirects to back_urls.
          // Resolve so the Brick can complete; user will be redirected by Mercado Pago.
          return Promise.resolve()
        }}
        onError={(error: { message?: string }) => {
          const message =
            error && typeof error.message === 'string'
              ? error.message
              : 'Error al procesar el pago con Mercado Pago.'
          onError?.(message)
        }}
      />
    </div>
  )
}
