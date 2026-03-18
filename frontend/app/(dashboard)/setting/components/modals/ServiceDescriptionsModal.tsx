'use client'

import type { ServiceListItem } from '@/types'

type Props = {
  service: ServiceListItem
  onClose: () => void
  onChangeShort: (value: string) => void
  onChangeLong: (value: string) => void
  onSave: () => void
}

export function ServiceDescriptionsModal({
  service,
  onClose,
  onChangeShort,
  onChangeLong,
  onSave,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-neutral-900">Descripciones · {service.name}</h3>
            <p className="mt-1 text-xs text-neutral-500">
              La corta se ve siempre; la extendida aparece al tocar “Acerca” en la web.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Cerrar
          </button>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-700">Descripción corta</label>
            <input
              type="text"
              defaultValue={service.shortDescription ?? ''}
              onChange={(e) => onChangeShort(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-700">Descripción extendida</label>
            <textarea
              rows={4}
              defaultValue={service.description ?? ''}
              onChange={(e) => onChangeLong(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onSave}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

