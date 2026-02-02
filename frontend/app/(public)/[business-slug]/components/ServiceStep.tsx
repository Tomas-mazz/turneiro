'use client'

import type { Business, ServiceOption } from '../types'

type ServiceStepProps = {
  business: Business
  selectedService: ServiceOption | null
  onSelectService: (s: ServiceOption) => void
  onContinue: () => void
  primaryColor: string
}

export function ServiceStep({
  business,
  selectedService,
  onSelectService,
  onContinue,
  primaryColor,
}: ServiceStepProps) {
  return (
    <section className="py-12 px-4 max-w-lg mx-auto">
      <h2 className="text-xl font-semibold text-neutral-900 mb-4">Elegí el servicio</h2>
      <ul className="space-y-2">
        {business.services.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onSelectService(s)}
              className="w-full flex justify-between items-center p-4 rounded-lg border border-neutral-200 hover:border-neutral-400 text-left"
            >
              <span>{s.name}</span>
              <span className="font-medium">
                {s.price.toFixed(2)} · {s.duration} min
              </span>
            </button>
          </li>
        ))}
      </ul>
      {selectedService && (
        <div className="mt-6 flex justify-between items-center">
          <span className="text-neutral-600">
            {selectedService.name} · {selectedService.price.toFixed(2)}
          </span>
          <button
            type="button"
            onClick={onContinue}
            className="px-4 py-2 rounded-lg font-medium text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Continuar
          </button>
        </div>
      )}
    </section>
  )
}
