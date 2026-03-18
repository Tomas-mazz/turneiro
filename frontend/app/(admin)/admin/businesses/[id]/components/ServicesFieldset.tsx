'use client'

import type React from 'react'
import type { ServiceListItem } from '@/types'

type NewService = {
  name: string
  price: string
  duration: string
  isActive: boolean
}

type Props = {
  newService: NewService
  setNewService: React.Dispatch<React.SetStateAction<NewService>>
  creatingService: boolean
  onAddService: (e: React.FormEvent) => void
  servicesLoading: boolean
  services: ServiceListItem[]
  editingService: ServiceListItem | null
  setEditingService: React.Dispatch<React.SetStateAction<ServiceListItem | null>>
  onUpdateService: (e: React.FormEvent) => void
  onDeleteService: (id: string) => void
}

export function ServicesFieldset({
  newService,
  setNewService,
  creatingService,
  onAddService,
  servicesLoading,
  services,
  editingService,
  setEditingService,
  onUpdateService,
  onDeleteService,
}: Props) {
  return (
    <fieldset id="servicios" className="rounded-lg border border-neutral-200 p-4">
      <legend className="text-sm font-medium text-neutral-700">Servicios</legend>
      <p className="mb-4 text-xs text-neutral-500">Creá, editá o eliminá servicios. El owner solo puede editar precio y duración.</p>

      <form onSubmit={onAddService} className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-40">
          <label htmlFor="newServiceName" className="mb-1 block text-xs text-neutral-600">
            Nombre *
          </label>
          <input
            id="newServiceName"
            type="text"
            required
            value={newService.name}
            onChange={(e) => setNewService((p) => ({ ...p, name: e.target.value }))}
            placeholder="ej. Corte"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="w-24">
          <label htmlFor="newServicePrice" className="mb-1 block text-xs text-neutral-600">
            Precio *
          </label>
          <input
            id="newServicePrice"
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
          <label htmlFor="newServiceDuration" className="mb-1 block text-xs text-neutral-600">
            Duración (min) *
          </label>
          <input
            id="newServiceDuration"
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
          {creatingService ? 'Agregando...' : 'Agregar'}
        </button>
      </form>

      {servicesLoading ? (
        <p className="text-sm text-neutral-500">Cargando servicios...</p>
      ) : services.length === 0 ? (
        <p className="text-sm text-neutral-500">No hay servicios. Agregá uno arriba.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-600">
              <th className="py-2">Nombre</th>
              <th className="py-2">Precio</th>
              <th className="py-2">Duración</th>
              <th className="py-2">Activo</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) =>
              editingService?.id === s.id ? (
                <tr key={s.id} className="border-b border-neutral-100 bg-neutral-50">
                  <td colSpan={5} className="py-3">
                    <form onSubmit={onUpdateService} className="flex flex-wrap items-center gap-3">
                      <input
                        type="text"
                        value={editingService.name}
                        onChange={(e) => setEditingService((p) => (p ? { ...p, name: e.target.value } : null))}
                        className="w-32 rounded border border-neutral-300 px-2 py-1 text-sm"
                        required
                      />
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={editingService.price}
                        onChange={(e) =>
                          setEditingService((p) => (p ? { ...p, price: Number(e.target.value) } : null))
                        }
                        className="w-20 rounded border border-neutral-300 px-2 py-1 text-sm"
                        required
                      />
                      <input
                        type="number"
                        min={15}
                        max={120}
                        value={editingService.duration}
                        onChange={(e) =>
                          setEditingService((p) => (p ? { ...p, duration: Number(e.target.value) } : null))
                        }
                        className="w-16 rounded border border-neutral-300 px-2 py-1 text-sm"
                        required
                      />
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={editingService.isActive}
                          onChange={(e) =>
                            setEditingService((p) => (p ? { ...p, isActive: e.target.checked } : null))
                          }
                          className="rounded"
                        />
                        Activo
                      </label>
                      <button
                        type="submit"
                        className="rounded bg-neutral-900 px-2 py-1 text-xs text-white hover:bg-neutral-800"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingService(null)}
                        className="rounded border border-neutral-300 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100"
                      >
                        Cancelar
                      </button>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={s.id} className="border-b border-neutral-100">
                  <td className="py-2">{s.name}</td>
                  <td className="py-2">$ {s.price}</td>
                  <td className="py-2">{s.duration} min</td>
                  <td className="py-2">{s.isActive ? 'Sí' : 'No'}</td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => setEditingService(s)}
                      className="text-neutral-600 underline hover:text-neutral-900"
                    >
                      Editar
                    </button>
                    {' · '}
                    <button
                      type="button"
                      onClick={() => onDeleteService(s.id)}
                      className="text-red-600 underline hover:text-red-800"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      )}
    </fieldset>
  )
}

