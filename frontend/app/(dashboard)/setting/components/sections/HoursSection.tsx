'use client'

import type { WorkingHoursItem } from '@/types'

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
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-600">
                <th className="py-2">Día</th>
                <th className="py-2">Cerrado</th>
                <th className="py-2">Apertura</th>
                <th className="py-2">Cierre</th>
                <th className="py-2">Corte inicio</th>
                <th className="py-2">Corte fin</th>
              </tr>
            </thead>
            <tbody>
              {workingHours.map((h) => (
                <tr key={h.dayOfWeek} className="border-b border-neutral-100">
                  <td className="py-2 font-medium">
                    {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][h.dayOfWeek]}
                  </td>
                  <td className="py-2">
                    <input
                      type="checkbox"
                      checked={h.isClosed}
                      onChange={(e) => onChange(h.dayOfWeek, 'isClosed', e.target.checked)}
                      className="rounded border-neutral-300 text-neutral-900"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="time"
                      value={h.startTime}
                      onChange={(e) => onChange(h.dayOfWeek, 'startTime', e.target.value)}
                      disabled={h.isClosed}
                      className="w-28 rounded border border-neutral-300 px-2 py-1 disabled:bg-neutral-100"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="time"
                      value={h.endTime}
                      onChange={(e) => onChange(h.dayOfWeek, 'endTime', e.target.value)}
                      disabled={h.isClosed}
                      className="w-28 rounded border border-neutral-300 px-2 py-1 disabled:bg-neutral-100"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="time"
                      value={h.lunchStart ?? ''}
                      onChange={(e) => onChange(h.dayOfWeek, 'lunchStart', e.target.value || null)}
                      disabled={h.isClosed}
                      placeholder="--:--"
                      className="w-28 rounded border border-neutral-300 px-2 py-1 disabled:bg-neutral-100"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="time"
                      value={h.lunchEnd ?? ''}
                      onChange={(e) => onChange(h.dayOfWeek, 'lunchEnd', e.target.value || null)}
                      disabled={h.isClosed}
                      placeholder="--:--"
                      className="w-28 rounded border border-neutral-300 px-2 py-1 disabled:bg-neutral-100"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

