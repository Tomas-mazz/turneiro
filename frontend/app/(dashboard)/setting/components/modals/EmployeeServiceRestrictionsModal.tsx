'use client'

import { useEffect, useMemo, useState } from 'react'
import type {
  OwnerEmployeeListItem,
  ServiceListItem,
  SubServiceAdminItem,
  EmployeeServiceRestrictionItem,
} from '@/types'
import {
  getOwnerEmployeeServiceRestrictions,
  replaceOwnerEmployeeServiceRestrictions,
} from '@/lib/api'

type Props = {
  open: boolean
  employee: OwnerEmployeeListItem | null
  services: ServiceListItem[]
  subServicesByService: Record<string, SubServiceAdminItem[]>
  onClose: () => void
}

type Row =
  | { key: string; kind: 'SERVICE'; id: string; label: string }
  | { key: string; kind: 'SUBSERVICE'; id: string; label: string }

function rowKey(kind: Row['kind'], id: string) {
  return `${kind}:${id}`
}

export function EmployeeServiceRestrictionsModal({
  open,
  employee,
  services,
  subServicesByService,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** true = employee DOES the service, false = disabled */
  const [enabledByKey, setEnabledByKey] = useState<Record<string, boolean>>({})
  const [existing, setExisting] = useState<EmployeeServiceRestrictionItem[]>([])
  const [openServiceIds, setOpenServiceIds] = useState<Record<string, boolean>>({})

  const rows: Row[] = useMemo(() => {
    const out: Row[] = []
    for (const s of services) {
      out.push({ key: rowKey('SERVICE', s.id), kind: 'SERVICE', id: s.id, label: s.name })
      const subs = subServicesByService[s.id] ?? []
      for (const sub of subs) {
        out.push({
          key: rowKey('SUBSERVICE', sub.id),
          kind: 'SUBSERVICE',
          id: sub.id,
          label: `${s.name} — ${sub.name}`,
        })
      }
    }
    return out
  }, [services, subServicesByService])

  useEffect(() => {
    if (!open || !employee) return
    setLoading(true)
    setError(null)
    getOwnerEmployeeServiceRestrictions(employee.id)
      .then((items) => {
        setExisting(items)
        const disabledKeys = new Set<string>()
        for (const it of items) {
          if (it.serviceId) disabledKeys.add(rowKey('SERVICE', it.serviceId))
          if (it.subServiceId) disabledKeys.add(rowKey('SUBSERVICE', it.subServiceId))
        }
        const next: Record<string, boolean> = {}
        for (const r of rows) {
          next[r.key] = !disabledKeys.has(r.key)
        }
        setEnabledByKey(next)
      })
      .catch((err) => {
        setError(err?.response?.data?.error || 'No se pudieron cargar los permisos por empleado.')
        setExisting([])
        setEnabledByKey({})
      })
      .finally(() => setLoading(false))
    // rows depends on services/subservices; safe to include so the UI stays in sync.
  }, [open, employee, rows])

  const servicesWithSubs = useMemo(() => {
    return services.map((s) => ({
      service: s,
      subServices: subServicesByService[s.id] ?? [],
    }))
  }, [services, subServicesByService])

  const setServiceAndSubsEnabled = (serviceId: string, enabled: boolean) => {
    setEnabledByKey((prev) => {
      const next = { ...prev }
      next[rowKey('SERVICE', serviceId)] = enabled
      const subs = subServicesByService[serviceId] ?? []
      for (const sub of subs) {
        next[rowKey('SUBSERVICE', sub.id)] = enabled
      }
      return next
    })
  }

  const handleSave = async () => {
    if (!employee) return
    setSaving(true)
    setError(null)
    try {
      const disabled: Array<{ serviceId: string } | { subServiceId: string }> = []
      for (const r of rows) {
        const enabled = enabledByKey[r.key]
        if (enabled === false) {
          disabled.push(r.kind === 'SERVICE' ? { serviceId: r.id } : { subServiceId: r.id })
        }
      }
      await replaceOwnerEmployeeServiceRestrictions(employee.id, { disabled })
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No se pudieron guardar los permisos por empleado.')
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
      aria-labelledby="restrictions-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <div>
            <h2 id="restrictions-title" className="text-base font-semibold text-neutral-900">
              Servicios por empleado — {employee.name}
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              Desactivá los servicios/subservicios que este empleado no realiza.
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
          ) : servicesWithSubs.length === 0 ? (
            <div className="py-8 text-sm text-neutral-600">Primero creá servicios.</div>
          ) : (
            <div className="space-y-2">
              {servicesWithSubs.map(({ service, subServices }) => {
                const serviceKey = rowKey('SERVICE', service.id)
                const serviceEnabled = enabledByKey[serviceKey] ?? true
                const hasSubs = subServices.length > 0
                const isOpen = openServiceIds[service.id] ?? false
                const allSubsEnabled = hasSubs
                  ? subServices.every((sub) => enabledByKey[rowKey('SUBSERVICE', sub.id)] ?? true)
                  : true
                const isAllEnabled = hasSubs ? serviceEnabled && allSubsEnabled : serviceEnabled

                return (
                  <div key={service.id} className="rounded-xl border border-neutral-200 bg-white">
                    <div className="flex items-start justify-between gap-3 p-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (!hasSubs) return
                          setOpenServiceIds((p) => ({ ...p, [service.id]: !(p[service.id] ?? false) }))
                        }}
                        className={`min-w-0 flex-1 text-left ${hasSubs ? 'cursor-pointer' : 'cursor-default'}`}
                        aria-expanded={hasSubs ? isOpen : undefined}
                      >
                        <div className="flex items-center gap-2">
                          <div className="truncate text-sm font-medium text-neutral-900">{service.name}</div>
                          {hasSubs && (
                            <span className="text-xs text-neutral-500">{isOpen ? '▴' : '▾'}</span>
                          )}
                        </div>
                        <div className="mt-0.5 text-xs text-neutral-500">
                          {isAllEnabled ? 'Habilitado' : 'Deshabilitado'}
                          {hasSubs ? ` · ${subServices.length} subservicio${subServices.length === 1 ? '' : 's'}` : ''}
                        </div>
                      </button>

                      <label className="flex items-center gap-2 text-sm text-neutral-800">
                        <input
                          type="checkbox"
                          checked={isAllEnabled}
                          onChange={(e) => setServiceAndSubsEnabled(service.id, e.target.checked)}
                          aria-label={`Lo realiza: ${service.name}`}
                        />
                        Lo realiza
                      </label>
                    </div>

                    {hasSubs && isOpen && (
                      <div className="border-t border-neutral-200 px-3 py-2">
                        <div className="space-y-2">
                          {subServices.map((sub) => {
                            const subKey = rowKey('SUBSERVICE', sub.id)
                            const enabled = enabledByKey[subKey] ?? true
                            return (
                              <div
                                key={sub.id}
                                className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-2"
                              >
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium text-neutral-900">{sub.name}</div>
                                  <div className="text-xs text-neutral-500">
                                    {enabled ? 'Habilitado' : 'Deshabilitado'}
                                  </div>
                                </div>
                                <label className="flex items-center gap-2 text-sm text-neutral-800">
                                  <input
                                    type="checkbox"
                                    checked={enabled}
                                    onChange={(e) =>
                                      setEnabledByKey((p) => ({ ...p, [subKey]: e.target.checked }))
                                    }
                                    aria-label={`Lo realiza: ${service.name} - ${sub.name}`}
                                  />
                                  Lo realiza
                                </label>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
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

