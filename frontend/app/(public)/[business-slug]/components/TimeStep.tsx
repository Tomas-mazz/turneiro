'use client'

import type { ServiceOption } from '../types'

type TimeStepProps = {
  selectedService: ServiceOption
  selectedDate: string
  slots: string[]
  slotsLoading: boolean
  selectedSlot: string | null
  onSelectedSlot: (slot: string | null) => void
  onContinue: () => void
  primaryColor: string
}

export function TimeStep({
  selectedService,
  selectedDate,
  slots,
  slotsLoading,
  selectedSlot,
  onSelectedSlot,
  onContinue,
  primaryColor,
}: TimeStepProps) {
  return (
    <section className="py-12 px-4 max-w-lg mx-auto">
      <h2 className="text-xl font-semibold text-neutral-900 mb-4">Elegí el horario</h2>
      {slotsLoading ? (
        <p className="text-neutral-500">Cargando horarios...</p>
      ) : slots.length === 0 ? (
        <p className="text-neutral-500">No hay horarios disponibles</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {slots.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSelectedSlot(s)}
              className={`py-2 rounded-lg border ${selectedSlot === s ? 'border-2 text-white' : 'border-neutral-200 hover:border-neutral-400'}`}
              style={
                selectedSlot === s
                  ? { backgroundColor: primaryColor, borderColor: primaryColor }
                  : undefined
              }
            >
              {s}
            </button>
          ))}
        </div>
      )}
      {selectedSlot && (
        <div className="mt-6 flex justify-end">
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
