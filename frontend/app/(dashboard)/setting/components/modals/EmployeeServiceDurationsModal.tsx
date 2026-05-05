'use client'

import { useEffect, useMemo, useState } from 'react'
import type { OwnerEmployeeListItem, ServiceListItem, SubServiceAdminItem, EmployeeServiceDurationItem } from '@/types'
import { getOwnerEmployeeServiceDurations, upsertOwnerEmployeeServiceDurations } from '@/lib/api'

type Props = {
  open: boolean
  employee: OwnerEmployeeListItem | null
  services: ServiceListItem[]
  subServicesByService: Record<string, SubServiceAdminItem[]>
  onClose: () => void
}

type Row =
  | { key: string; kind: 'SERVICE'; id: string; label: string; baseDuration: number }
  | { key: string; kind: 'SUBSERVICE'; id: string; label: string; baseDuration: number }

function rowKey(kind: Row['kind'], id: string) {
  return `${kind}:${id}`
}

export function EmployeeServiceDurationsModal({
  open,
  employee,
  services,
  subServicesByService,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [existing, setExisting] = useState<EmployeeServiceDurationItem[]>([])

  const rows: Row[] = useMemo(() => {
    const out: Row[] = []
    for (const s of services) {
      out.push({
        key: rowKey('SERVICE', s.id),
        kind: 'SERVICE',
        id: s.id,
        label: s.name,
        baseDuration: s.duration,
      })
      const subs = subServicesByService[s.id] ?? []
      for (const sub of subs) {
        out.push({
          key: rowKey('SUBSERVICE', sub.id),
          kind: 'SUBSERVICE',
          id: sub.id,
          label: `${s.name} — ${sub.name}`,
          baseDuration: sub.duration,
        })
      }
    }
    return out
  }, [services, subServicesByService])

  useEffect(() => {
    if (!open || !employee) return
    setLoading(true)
    setError(null)
    getOwnerEmployeeServiceDurations(employee.id)
      .then((items) => {
        setExisting(items)
        const next: Record<string, string> = {}
        for (const it of items) {
          if (it.serviceId) next[rowKey('SERVICE', it.serviceId)] = String(it.duration)
          if (it.subServiceId) next[rowKey('SUBSERVICE', it.subServiceId)] = String(it.duration)
        }
        setValues(next)
      })
      .catch((err) => {
        setError(err?.response?.data?.error || 'No se pudieron cargar las duraciones.')
        setExisting([])
        setValues({})
      })
      .finally(() => setLoading(false))
  }, [open, employee])

  const existingKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const it of existing) {
      if (it.serviceId) keys.add(rowKey('SERVICE', it.serviceId))
      if (it.subServiceId) keys.add(rowKey('SUBSERVICE', it.subServiceId))
    }
    return keys
  }, [existing])

  const handleSave = async () => {
    if (!employee) return
    setSaving(true)
    setError(null)
    try {
      const items: Array<
        | { serviceId: string; duration: number | null }
        | { subServiceId: string; duration: number | null }
      > = []

      for (const r of rows) {
        const v = (values[r.key] ?? '').trim()
        const shouldSend = existingKeys.has(r.key) || v.length > 0
        if (!shouldSend) continue

        if (!v) {
          items.push(r.kind === 'SERVICE' ? { serviceId: r.id, duration: null } : { subServiceId: r.id, duration: null })
          continue
        }
        const n = Number(v)
        if (!Number.isFinite(n) || n < 5 || n > 600) {
          setError('Todas las duraciones deben estar entre 5 y 600 minutos.')
          setSaving(false)
          return
        }
        items.push(r.kind === 'SERVICE' ? { serviceId: r.id, duration: Math.round(n) } : { subServiceId: r.id, duration: Math.round(n) })
      }

      await upsertOwnerEmployeeServiceDurations(employee.id, { items })
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No se pudieron guardar las duraciones.')
    } finally {
      setSaving(false)
    }
  }

  if (!open || !employee) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="durations-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <div>
            <h2 id="durations-title" className="text-base font-semibold text-neutral-900">
              Duración por servicio — {employee.name}
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              Si dejás vacío, se usa la duración base del servicio/subservicio.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
            aria-label="Cerrar"
          >
            Cerrar
          </button>
        </div>

        <div className="max-h-[70vh] overflow-auto px-5 py-4">
          {error && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-8 text-sm text-neutral-600">Cargando…</div>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => (
                <div
                  key={r.key}
                  className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-neutral-900">{r.label}</div>
                    <div className="mt-0.5 text-xs text-neutral-500">Base: {r.baseDuration} min</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      inputMode="numeric"
                      value={values[r.key] ?? ''}
                      onChange={(e) => setValues((p) => ({ ...p, [r.key]: e.target.value }))}
                      className="w-28 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                      placeholder={`${r.baseDuration}`}
                      aria-label={`Duración para ${r.label}`}
                    />
                    <span className="text-sm text-neutral-600">min</span>
                    <button
                      type="button"
                      onClick={() => setValues((p) => ({ ...p, [r.key]: '' }))}
                      className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-neutral-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

