'use client'

import type { WorkingHoursItem } from '@/types'

type Props = {
  workingHours: WorkingHoursItem[]
  onChange: (dayOfWeek: number, field: keyof WorkingHoursItem, value: string | boolean | null) => void
  className?: string
}

/** One row per day: closed toggle, opening/closing time and an optional break. */
export function WorkingHoursTable({ workingHours, onChange, className = '' }: Props) {
  return (
    <div className={`overflow-x-auto ${className}`}>
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
  )
}
