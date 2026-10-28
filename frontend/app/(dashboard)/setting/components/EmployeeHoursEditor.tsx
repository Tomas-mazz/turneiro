'use client'

import { useEffect, useState } from 'react'
import type { WorkingHoursItem } from '@/types'
import {
  getOwnerEmployeeWorkingHours,
  resetOwnerEmployeeWorkingHours,
  updateOwnerEmployeeWorkingHours,
} from '@/lib/api'
import { WorkingHoursTable } from './WorkingHoursTable'

function errorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { error?: string; details?: { message: string }[] } } })?.response?.data
  return data?.details?.[0]?.message || data?.error || fallback
}

/** An employee's schedule: the business hours, or their own (only their agenda changes). */
export function EmployeeHoursEditor({ employeeId }: { employeeId: string }) {
  const [loading, setLoading] = useState(true)
  const [custom, setCustom] = useState(false)
  const [hours, setHours] = useState<WorkingHoursItem[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getOwnerEmployeeWorkingHours(employeeId)
      .then((res) => {
        if (cancelled) return
        setCustom(res.custom)
        setHours(res.hours)
      })
      .catch(() => {
        if (!cancelled) setError('No se pudo cargar el horario.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [employeeId])

  const handleChange = (dayOfWeek: number, field: keyof WorkingHoursItem, value: string | boolean | null) => {
    setHours((prev) => prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h)))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = custom
        ? await updateOwnerEmployeeWorkingHours(
            employeeId,
            hours.map(({ dayOfWeek, startTime, endTime, isClosed, lunchStart, lunchEnd }) => ({
              dayOfWeek,
              startTime,
              endTime,
              isClosed,
              lunchStart: lunchStart || null,
              lunchEnd: lunchEnd || null,
            }))
          )
        : await resetOwnerEmployeeWorkingHours(employeeId)
      setCustom(res.custom)
      setHours(res.hours)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(errorMessage(err, 'No se pudo guardar el horario.'))
    } finally {
      setSaving(false)
    }
  }

  const optionClass = (active: boolean) =>
    `rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? 'border-neutral-900 bg-neutral-900 text-white'
        : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
    }`

  return (
    <div className="mt-4 rounded-lg border border-neutral-200 p-4">
      <h4 className="text-sm font-semibold text-neutral-900">Horario de atención</h4>
      <p className="mt-1 text-xs text-neutral-600">
        Los clientes solo ven turnos de este profesional dentro de su horario.
      </p>

      {loading ? (
        <p className="mt-3 text-sm text-neutral-500">Cargando horario...</p>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Horario del profesional">
            <button
              type="button"
              role="radio"
              aria-checked={!custom}
              onClick={() => setCustom(false)}
              className={optionClass(!custom)}
            >
              Igual al negocio
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={custom}
              onClick={() => setCustom(true)}
              className={optionClass(custom)}
            >
              Horario propio
            </button>
          </div>

          {custom ? (
            <WorkingHoursTable className="mt-3" workingHours={hours} onChange={handleChange} />
          ) : (
            <p className="mt-3 text-sm text-neutral-600">
              Usa los horarios de apertura del negocio. Si cambiás esos horarios, también cambian los suyos.
            </p>
          )}

          {error && <p className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
          >
            {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar horario'}
          </button>
        </>
      )}
    </div>
  )
}
