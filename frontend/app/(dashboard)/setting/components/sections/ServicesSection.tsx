'use client'

import type React from 'react'
import { useMemo, useState } from 'react'
import type { OwnerEmployeeListItem, ServiceListItem } from '@/types'

type Props = {
  visible: boolean
  subServicesEnabled: boolean
  allowMultipleServices: boolean
  allowMultipleServicesSaving: boolean
  onToggleAllowMultipleServices: (next: boolean) => void
  loadingServices: boolean
  services: ServiceListItem[]
  employees: OwnerEmployeeListItem[]
  onOpenServiceDurations: (emp: OwnerEmployeeListItem) => void
  onOpenServiceRestrictions: (emp: OwnerEmployeeListItem) => void
  newService: { name: string; price: string; duration: string; isActive: boolean }
  setNewService: React.Dispatch<
    React.SetStateAction<{ name: string; price: string; duration: string; isActive: boolean }>
  >
  creatingService: boolean
  onAddService: (e: React.FormEvent) => void
  onSaveService: (s: ServiceListItem) => void
  onToggleServiceActive: (s: ServiceListItem) => void
  onDeleteService: (id: string) => void
  savingId: string | null
  justSavedId: string | null
  setEditingServiceName: React.Dispatch<React.SetStateAction<Record<string, string>>>
  setEditingPrice: React.Dispatch<React.SetStateAction<Record<string, string>>>
  setEditingDuration: React.Dispatch<React.SetStateAction<Record<string, string>>>
  openDescriptions: (serviceId: string) => void
  openImages: (serviceId: string) => void
  openSubServices: (serviceId: string) => void
}

export function ServicesSection({
  visible,
  subServicesEnabled,
  allowMultipleServices,
  allowMultipleServicesSaving,
  onToggleAllowMultipleServices,
  loadingServices,
  services,
  employees,
  onOpenServiceDurations,
  onOpenServiceRestrictions,
  newService,
  setNewService,
  creatingService,
  onAddService,
  onSaveService,
  onToggleServiceActive,
  onDeleteService,
  savingId,
  justSavedId,
  setEditingServiceName,
  setEditingPrice,
  setEditingDuration,
  openDescriptions,
  openImages,
  openSubServices,
}: Props) {
  const [openPanels, setOpenPanels] = useState<Record<string, boolean>>({
    durations: false,
    restrictions: false,
    create: false,
    list: true,
  })

  const togglePanel = (key: keyof typeof openPanels) => {
    setOpenPanels((p) => ({ ...p, [key]: !p[key] }))
  }

  const isDurationsOpen = openPanels.durations
  const isRestrictionsOpen = openPanels.restrictions
  const isCreateOpen = openPanels.create
  const isListOpen = openPanels.list

  const ownerFirstEmployees = useMemo(() => {
    const list = [...employees]
    list.sort((a, b) => {
      if (a.isOwner === b.isOwner) return a.name.localeCompare(b.name)
      return a.isOwner ? -1 : 1
    })
    return list
  }, [employees])

  if (!visible) return null

  const SwitchRow = ({
    title,
    description,
    checked,
    disabled,
    onChange,
  }: {
    title: string
    description: string
    checked: boolean
    disabled: boolean
    onChange: (next: boolean) => void
  }) => {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-neutral-900">{title}</p>
            <p className="mt-0.5 text-xs text-neutral-600">{description}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-8 w-[4.5rem] shrink-0 items-center rounded-full border transition-colors disabled:opacity-60 ${
              checked ? 'border-emerald-300 bg-emerald-500' : 'border-neutral-300 bg-neutral-200'
            }`}
          >
            <span className="sr-only">{title}</span>
            <span
              className={`absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] font-bold text-neutral-800 shadow transition-transform ${
                checked ? 'translate-x-[2.5rem]' : 'translate-x-0'
              }`}
              aria-hidden
            >
              {checked ? 'SI' : 'NO'}
            </span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <section className="mt-8 mb-10 sm:mt-10 sm:mb-12">
      <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">Servicios (precio, duración y estado)</h2>
      <div className="mt-3 space-y-3">
        <SwitchRow
          title="Permitir seleccionar más de un servicio"
          description="Si está activado, el cliente podrá seleccionar múltiples servicios/subservicios en una misma reserva (ej. uñas + pies)."
          checked={allowMultipleServices}
          disabled={allowMultipleServicesSaving}
          onChange={onToggleAllowMultipleServices}
        />
      </div>

      <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <button
          type="button"
          onClick={() => togglePanel('durations')}
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={isDurationsOpen}
        >
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Duración por empleado</h3>
            <p className="mt-1 text-xs text-neutral-600">
              Ajustá cuánto tarda cada empleado (incluyendo el dueño) en cada servicio/subservicio.
            </p>
          </div>
          <span className="text-sm font-medium text-neutral-700">{isDurationsOpen ? 'Cerrar' : 'Abrir'} ▾</span>
        </button>

        {isDurationsOpen && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-neutral-600">
              Esto afecta disponibilidad y fin del turno, pero el cliente ve un estimado.
            </p>
            {employees.length === 0 ? (
              <p className="text-sm text-neutral-500">No hay empleados todavía.</p>
            ) : services.length === 0 ? (
              <p className="text-sm text-neutral-500">Primero creá un servicio.</p>
            ) : (
              ownerFirstEmployees.map((emp) => (
                <div
                  key={emp.id}
                  className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-neutral-900">
                      {emp.name} {emp.isOwner ? '(Dueño)' : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenServiceDurations(emp)}
                    className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
                  >
                    Configurar duraciones
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <button
          type="button"
          onClick={() => togglePanel('restrictions')}
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={isRestrictionsOpen}
        >
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Servicios por empleado</h3>
            <p className="mt-1 text-xs text-neutral-600">
              Elegí qué servicios/subservicios realiza cada empleado (si no lo hace, no aparecerá al reservar).
            </p>
          </div>
          <span className="text-sm font-medium text-neutral-700">{isRestrictionsOpen ? 'Cerrar' : 'Abrir'} ▾</span>
        </button>

        {isRestrictionsOpen && (
          <div className="mt-3 space-y-2">
            {employees.length === 0 ? (
              <p className="text-sm text-neutral-500">No hay empleados todavía.</p>
            ) : services.length === 0 ? (
              <p className="text-sm text-neutral-500">Primero creá un servicio.</p>
            ) : (
              ownerFirstEmployees.map((emp) => (
                <div
                  key={emp.id}
                  className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-neutral-900">
                      {emp.name} {emp.isOwner ? '(Dueño)' : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenServiceRestrictions(emp)}
                    className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
                  >
                    Configurar servicios
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {loadingServices ? (
        <p className="mt-2 text-sm text-neutral-500">Cargando servicios...</p>
      ) : services.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-500">No hay servicios. Podés crearlos desde aquí.</p>
      ) : (
        <>
          <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <button
              type="button"
              onClick={() => togglePanel('create')}
              className="flex w-full items-center justify-between gap-3 text-left"
              aria-expanded={isCreateOpen}
            >
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">Agregar servicio</h3>
                <p className="mt-1 text-xs text-neutral-600">Creá un servicio nuevo con precio y duración base.</p>
              </div>
              <span className="text-sm font-medium text-neutral-700">{isCreateOpen ? 'Cerrar' : 'Abrir'} ▾</span>
            </button>

            {isCreateOpen && (
              <form onSubmit={onAddService} className="mt-4 flex flex-wrap items-end gap-3">
                <div className="w-40">
                  <label htmlFor="newServiceNameDashboard" className="mb-1 block text-xs text-neutral-600">
                    Nombre *
                  </label>
                  <input
                    id="newServiceNameDashboard"
                    type="text"
                    required
                    value={newService.name}
                    onChange={(e) => setNewService((p) => ({ ...p, name: e.target.value }))}
                    placeholder="ej. Corte"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="w-24">
                  <label htmlFor="newServicePriceDashboard" className="mb-1 block text-xs text-neutral-600">
                    Precio *
                  </label>
                  <input
                    id="newServicePriceDashboard"
                    type="number"
                    required
                    min={0}
                    step={0.01}
                    value={newService.price}
                    onChange={(e) => setNewService((p) => ({ ...p, price: e.target.value }))}
                    placeholder="500"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="w-24">
                  <label htmlFor="newServiceDurationDashboard" className="mb-1 block text-xs text-neutral-600">
                    Duración (min) *
                  </label>
                  <input
                    id="newServiceDurationDashboard"
                    type="number"
                    required
                    min={15}
                    max={120}
                    value={newService.duration}
                    onChange={(e) => setNewService((p) => ({ ...p, duration: e.target.value }))}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newService.isActive}
                    onChange={(e) => setNewService((p) => ({ ...p, isActive: e.target.checked }))}
                    className="rounded border-neutral-300"
                  />
                  <span className="text-xs text-neutral-600">Activo</span>
                </label>
                <button
                  type="submit"
                  disabled={creatingService}
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {creatingService ? 'Agregando...' : 'Agregar servicio'}
                </button>
              </form>
            )}
          </div>

          <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <button
              type="button"
              onClick={() => togglePanel('list')}
              className="flex w-full items-center justify-between gap-3 text-left"
              aria-expanded={isListOpen}
            >
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">Tus servicios</h3>
                <p className="mt-1 text-xs text-neutral-600">Editá precio/duración base, estado, imágenes y subservicios.</p>
              </div>
              <span className="text-sm font-medium text-neutral-700">{isListOpen ? 'Cerrar' : 'Abrir'} ▾</span>
            </button>

            {isListOpen && (
              <>
                {/* Mobile */}
                <div className="mt-4 space-y-4 md:hidden">
                  {services.map((s) => (
                    <div key={s.id} className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
                      <div className="mb-3">
                        <label className="mb-1 block text-xs font-medium text-neutral-500">Nombre del servicio</label>
                        <input
                          type="text"
                          defaultValue={s.name}
                          onChange={(e) => setEditingServiceName((prev) => ({ ...prev, [s.id]: e.target.value }))}
                          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-neutral-500">Precio ($)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                            defaultValue={s.price}
                            onChange={(e) => setEditingPrice((prev) => ({ ...prev, [s.id]: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-neutral-500">Duración (min)</label>
                          <input
                            type="number"
                            min="15"
                            max="120"
                            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                            defaultValue={s.duration}
                            onChange={(e) => setEditingDuration((prev) => ({ ...prev, [s.id]: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openDescriptions(s.id)}
                          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                        >
                          Descripciones
                        </button>
                        <button
                          type="button"
                          onClick={() => openImages(s.id)}
                          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                        >
                          Imágenes
                        </button>
                        <button
                          type="button"
                          onClick={() => openSubServices(s.id)}
                          disabled={!subServicesEnabled}
                          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                        >
                          Subservicios
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => onToggleServiceActive(s)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                            s.isActive
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                              : 'border-neutral-300 bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {s.isActive ? 'Activo' : 'Inactivo'}
                        </button>
                        <button
                          type="button"
                          disabled={savingId === s.id}
                          onClick={() => onSaveService(s)}
                          className={`inline-block rounded-lg border px-4 py-2 text-sm font-medium ${
                            justSavedId === s.id
                              ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                              : savingId === s.id
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 opacity-70'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:opacity-50'
                          }`}
                        >
                          {savingId === s.id ? 'Guardando...' : justSavedId === s.id ? 'Guardado ✓' : 'Guardar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteService(s.id)}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop */}
                <div className="mt-4 hidden md:block md:overflow-x-auto md:rounded-lg md:border md:border-neutral-200">
                  <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-4 py-3 font-medium text-neutral-700">Servicio</th>
                        <th className="px-4 py-3 font-medium text-neutral-700">Precio ($)</th>
                        <th className="px-4 py-3 font-medium text-neutral-700">Duración (min)</th>
                        <th className="px-4 py-3 font-medium text-neutral-700">Estado</th>
                        <th className="px-4 py-3 font-medium text-neutral-700">Acciones</th>
                      </tr>
                    </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {services.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-medium text-neutral-900 align-top">
                      <div>
                        <input
                          type="text"
                          defaultValue={s.name}
                          onChange={(e) => setEditingServiceName((prev) => ({ ...prev, [s.id]: e.target.value }))}
                          className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
                        />
                      </div>
                      <div className="mt-2 rounded bg-neutral-50 p-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openDescriptions(s.id)}
                            className="rounded border border-neutral-300 bg-white px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-100"
                          >
                            Descripciones
                          </button>
                          <button
                            type="button"
                            onClick={() => openImages(s.id)}
                            className="rounded border border-neutral-300 bg-white px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-100"
                          >
                            Imágenes
                          </button>
                          <button
                            type="button"
                            onClick={() => openSubServices(s.id)}
                            disabled={!subServicesEnabled}
                            className="rounded border border-neutral-300 bg-white px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-100"
                          >
                            Subservicios
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-24 rounded border border-neutral-300 px-2 py-1"
                        defaultValue={s.price}
                        onChange={(e) => setEditingPrice((prev) => ({ ...prev, [s.id]: e.target.value }))}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="15"
                        max="120"
                        className="w-20 rounded border border-neutral-300 px-2 py-1"
                        defaultValue={s.duration}
                        onChange={(e) => setEditingDuration((prev) => ({ ...prev, [s.id]: e.target.value }))}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onToggleServiceActive(s)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                          s.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-neutral-300 bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {s.isActive ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          disabled={savingId === s.id}
                          onClick={() => onSaveService(s)}
                          className={`inline-block rounded-lg border px-3 py-1.5 text-sm font-medium ${
                            justSavedId === s.id
                              ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                              : savingId === s.id
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 opacity-70'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:opacity-50'
                          }`}
                        >
                          {savingId === s.id ? 'Guardando...' : justSavedId === s.id ? 'Guardado ✓' : 'Guardar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteService(s.id)}
                          className="inline-block rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </section>
  )
}

