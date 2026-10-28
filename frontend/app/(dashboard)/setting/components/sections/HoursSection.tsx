'use client'

import type { WorkingHoursItem } from '@/types'
import { WorkingHoursTable } from '../WorkingHoursTable'

type Props = {
  visible: boolean
  workingHours: WorkingHoursItem[]
  loading: boolean
  saving: boolean
  error: string | null
  justSaved: boolean
  onChange: (dayOfWeek: number, field: keyof WorkingHoursItem, value: string | boolean | null) => void
  onSave: () => void
}

export function HoursSection({
  visible,
  workingHours,
  loading,
  saving,
  error,
  justSaved,
  onChange,
  onSave,
}: Props) {
  if (!visible) return null

  return (
    <section className="mt-8 mb-10 sm:mt-10 sm:mb-12">
      <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">Horarios de apertura</h2>
      <p className="mt-1 text-sm text-neutral-600">
        Configurá horario de apertura y cierre por día. Opcional: pausa donde no se atiende (ej. almuerzo).
      </p>
      {error && <p className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      {justSaved && !error && (
        <p className="mt-3 rounded-md bg-emerald-50 p-2 text-sm text-emerald-700">Horarios guardados correctamente.</p>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-neutral-500">Cargando horarios...</p>
      ) : workingHours.length > 0 ? (
        <WorkingHoursTable className="mt-4" workingHours={workingHours} onChange={onChange} />
      ) : (
        <p className="mt-4 text-sm text-neutral-500">
          Todavía no configuraste horarios. Completá al menos un día para que se ofrezcan turnos en la página de reservas.
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading || saving}
          onClick={onSave}
          className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar horarios'}
        </button>
      </div>
    </section>
  )
}

