'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ServiceListItem, SubServiceAdminItem, ServiceAddOnAdminItem } from '@/types'
import {
  getServiceAddOns,
  createServiceAddOn,
  updateServiceAddOn,
  deleteServiceAddOn,
  getAdminBusinessServiceAddOns,
  createAdminBusinessServiceAddOn,
  updateAdminBusinessServiceAddOn,
  deleteAdminBusinessServiceAddOn,
} from '@/lib/api'

type ClientMode = { kind: 'owner' } | { kind: 'admin'; businessId: string }

type Props = {
  visible: boolean
  client: ClientMode
  services: ServiceListItem[]
  subServicesByService: Record<string, SubServiceAdminItem[]>
}

/** Etiquetas legibles para la lista (servicio completo vs subservicios puntuales). */
function describeAddOnScopes(
  row: ServiceAddOnAdminItem,
  services: ServiceListItem[],
  subServicesByService: Record<string, SubServiceAdminItem[]>
): string[] {
  const lines: string[] = []
  const svcById = new Map(services.map((s) => [s.id, s]))

  for (const sid of row.serviceIds) {
    const s = svcById.get(sid)
    lines.push(s ? `${s.name} (todo el servicio)` : 'Servicio (referencia no encontrada)')
  }

  for (const subId of row.subServiceIds) {
    let label: string | null = null
    for (const svc of services) {
      const subs = subServicesByService[svc.id] ?? []
      const sub = subs.find((x) => x.id === subId)
      if (sub) {
        label = `${svc.name}: ${sub.name}`
        break
      }
    }
    lines.push(label ?? 'Subservicio (referencia no encontrada)')
  }

  return lines
}

export function ServiceAddOnsSection({ visible, client, services, subServicesByService }: Props) {
  const [items, setItems] = useState<ServiceAddOnAdminItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [draftServiceIds, setDraftServiceIds] = useState<Record<string, boolean>>({})
  const [draftSubIds, setDraftSubIds] = useState<Record<string, boolean>>({})
  const [editingId, setEditingId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!visible) return
    setLoading(true)
    setError(null)
    try {
      const data =
        client.kind === 'owner'
          ? await getServiceAddOns()
          : await getAdminBusinessServiceAddOns(client.businessId)
      setItems(data)
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'No se pudieron cargar los adicionales'
      )
    } finally {
      setLoading(false)
    }
  }, [visible, client])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const toggleService = (id: string) => {
    setDraftServiceIds((p) => ({ ...p, [id]: !p[id] }))
  }

  const toggleSub = (id: string) => {
    setDraftSubIds((p) => ({ ...p, [id]: !p[id] }))
  }

  const resetDraft = () => {
    setNewName('')
    setNewPrice('')
    setDraftServiceIds({})
    setDraftSubIds({})
    setEditingId(null)
  }

  const startEdit = (row: ServiceAddOnAdminItem) => {
    setEditingId(row.id)
    setNewName(row.name)
    setNewPrice(String(row.price))
    const s: Record<string, boolean> = {}
    row.serviceIds.forEach((id) => {
      s[id] = true
    })
    const sub: Record<string, boolean> = {}
    row.subServiceIds.forEach((id) => {
      sub[id] = true
    })
    setDraftServiceIds(s)
    setDraftSubIds(sub)
  }

  const selectedServiceIds = Object.entries(draftServiceIds)
    .filter(([, v]) => v)
    .map(([k]) => k)
  const selectedSubIds = Object.entries(draftSubIds)
    .filter(([, v]) => v)
    .map(([k]) => k)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newPrice) return
    setSaving(true)
    setError(null)
    try {
      const body = {
        name: newName.trim(),
        price: Number(newPrice),
        isActive: true,
        serviceIds: selectedServiceIds,
        subServiceIds: selectedSubIds,
      }
      if (editingId) {
        const updated =
          client.kind === 'owner'
            ? await updateServiceAddOn(editingId, body)
            : await updateAdminBusinessServiceAddOn(client.businessId, editingId, body)
        setItems((prev) =>
          prev.map((x) => (x.id === updated.id ? updated : x)).sort((a, b) => a.name.localeCompare(b.name))
        )
      } else {
        const created =
          client.kind === 'owner'
            ? await createServiceAddOn(body)
            : await createAdminBusinessServiceAddOn(client.businessId, body)
        setItems((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      }
      resetDraft()
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          (editingId ? 'Error al actualizar adicional' : 'Error al crear adicional')
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este adicional?')) return
    setSaving(true)
    setError(null)
    try {
      if (client.kind === 'owner') await deleteServiceAddOn(id)
      else await deleteAdminBusinessServiceAddOn(client.businessId, id)
      setItems((prev) => prev.filter((x) => x.id !== id))
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Error al eliminar'
      )
    } finally {
      setSaving(false)
    }
  }

  if (!visible) return null

  return (
    <section className="mt-10 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-neutral-900">Adicionales</h2>
      <p className="mt-1 text-sm text-neutral-600">
        Opciones extra con precio (por ejemplo nail art). Marcá el servicio completo para todos los
        subservicios, o solo subservicios puntuales.
      </p>

      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-neutral-500">Cargando…</p>
      ) : (
        <>
          <ul className="mt-4 space-y-2">
            {items.length === 0 ? (
              <li className="text-sm text-neutral-500">Todavía no hay adicionales.</li>
            ) : (
              items.map((row) => {
                const scopeLines = describeAddOnScopes(row, services, subServicesByService)
                return (
                <li
                  key={row.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div>
                      <span className="font-medium text-neutral-900">{row.name}</span>
                      <span className="ml-2 text-neutral-600">$ {row.price.toFixed(0)}</span>
                      {!row.isActive && (
                        <span className="ml-2 text-xs font-medium text-amber-700">Inactivo</span>
                      )}
                    </div>
                    {scopeLines.length > 0 ? (
                      <p className="mt-1.5 text-xs leading-snug text-neutral-600">
                        <span className="font-medium text-neutral-700">Incluido en: </span>
                        {scopeLines.join(' · ')}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-xs text-amber-800">
                        Sin servicios marcados: no aparecerá en la reserva pública.
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-3 pt-0.5">
                    <button
                      type="button"
                      onClick={() => startEdit(row)}
                      disabled={saving}
                      className="text-sm font-medium text-neutral-800 hover:underline disabled:opacity-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(row.id)}
                      disabled={saving}
                      className="text-sm font-medium text-red-700 hover:underline disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
                )
              })
            )}
          </ul>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4 border-t border-neutral-200 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-neutral-800">
                {editingId ? 'Editar adicional' : 'Nuevo adicional'}
              </h3>
              {editingId && (
                <button
                  type="button"
                  onClick={resetDraft}
                  className="text-xs font-medium text-neutral-600 hover:underline"
                >
                  Cancelar edición
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="min-w-[160px] flex-1">
                <label className="mb-1 block text-xs text-neutral-600">Nombre</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  placeholder="Ej. Nail art"
                />
              </div>
              <div className="w-28">
                <label className="mb-1 block text-xs text-neutral-600">Precio</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="max-h-64 space-y-3 overflow-y-auto rounded-lg border border-neutral-200 p-3">
              {services.map((svc) => {
                const subs = subServicesByService[svc.id] ?? []
                return (
                  <div key={svc.id} className="text-sm">
                    <label className="flex cursor-pointer items-start gap-2 font-medium text-neutral-800">
                      <input
                        type="checkbox"
                        checked={!!draftServiceIds[svc.id]}
                        onChange={() => toggleService(svc.id)}
                        className="mt-1"
                      />
                      <span>
                        {svc.name} <span className="font-normal text-neutral-500">(todo el servicio)</span>
                      </span>
                    </label>
                    {subs.length > 0 && (
                      <ul className="ml-6 mt-1 space-y-1 border-l border-neutral-200 pl-3">
                        {subs.map((sub) => (
                          <li key={sub.id}>
                            <label className="flex cursor-pointer items-start gap-2 text-neutral-700">
                              <input
                                type="checkbox"
                                checked={!!draftSubIds[sub.id]}
                                onChange={() => toggleSub(sub.id)}
                                className="mt-0.5"
                              />
                              <span>{sub.name}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>

            <button
              type="submit"
              disabled={saving || !newName.trim() || !newPrice}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? 'Guardando…' : editingId ? 'Actualizar adicional' : 'Guardar adicional'}
            </button>
          </form>
        </>
      )}
    </section>
  )
}
