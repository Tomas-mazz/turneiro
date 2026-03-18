'use client'

import type React from 'react'
import type { ServiceListItem } from '@/types'

type Props = {
  visible: boolean
  showServiceConfirmModal: boolean
  showServiceConfirmModalSaving: boolean
  onToggleShowConfirm: (next: boolean) => void
  loadingServices: boolean
  services: ServiceListItem[]
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
  showServiceConfirmModal,
  showServiceConfirmModalSaving,
  onToggleShowConfirm,
  loadingServices,
  services,
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
  if (!visible) return null

  return (
    <section className="mt-8 mb-10 sm:mt-10 sm:mb-12">
      <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">Servicios (precio, duración y estado)</h2>
      <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={showServiceConfirmModal}
            disabled={showServiceConfirmModalSaving}
            onChange={(e) => onToggleShowConfirm(e.target.checked)}
            className="mt-1 rounded border-neutral-300"
          />
          <span>
            <span className="block text-sm font-medium text-neutral-900">Pedir confirmación antes del calendario</span>
            <span className="mt-0.5 block text-xs text-neutral-600">
              Cuando el cliente confirme un servicio/subservicio, se mostrará un segundo modal para confirmar antes de
              pasar al calendario.
            </span>
          </span>
        </label>
      </div>

      {loadingServices ? (
        <p className="mt-2 text-sm text-neutral-500">Cargando servicios...</p>
      ) : services.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-500">No hay servicios. Podés crearlos desde aquí.</p>
      ) : (
        <>
          <form
            onSubmit={onAddService}
            className="mt-4 mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
          >
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
                      s.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-neutral-300 bg-neutral-100 text-neutral-700'
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
    </section>
  )
}

