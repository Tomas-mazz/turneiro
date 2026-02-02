'use client'

import type { ServiceOption } from '../types'

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
  primaryColor: string
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
  primaryColor,
}: ClientFormStepProps) {
  return (
    <section className="py-12 px-4 max-w-lg mx-auto">
      <h2 className="text-xl font-semibold text-neutral-900 mb-4">Tus datos</h2>
      <p className="text-sm text-neutral-500 mb-4">
        {selectedService.name} · {selectedDate} at {selectedSlot}
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="clientName" className="block text-sm font-medium text-neutral-700 mb-1">
            Nombre completo
          </label>
          <input
            id="clientName"
            type="text"
            required
            value={clientName}
            onChange={(e) => onClientName(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-offset-0"
            style={{ ['--tw-ring-color' as string]: primaryColor }}
          />
        </div>
        <div>
          <label htmlFor="clientPhone" className="block text-sm font-medium text-neutral-700 mb-1">
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
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-offset-0"
            placeholder="+54 11 12345678"
          />
        </div>
        <p className="text-xs text-neutral-500">
          Estos datos son obligatorios para la confirmación, recordatorios y el enlace para cancelar.
        </p>
        {submitError && <p className="text-sm text-red-600">{submitError}</p>}
        <button
          type="submit"
          disabled={submitLoading}
          className="w-full py-3 rounded-lg font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: primaryColor }}
        >
          {submitLoading ? 'Reservando...' : 'Confirmar reserva'}
        </button>
      </form>
    </section>
  )
}
