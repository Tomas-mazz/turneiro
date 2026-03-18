'use client'

import type React from 'react'
import type { SubServiceAdminItem, ServiceListItem } from '@/types'

type Props = {
  service: ServiceListItem
  subServices: SubServiceAdminItem[]
  mobileSubServiceOpenId: string | null
  setMobileSubServiceOpenId: (id: string | null) => void
  mobileAddSubOpen: boolean
  setMobileAddSubOpen: (open: boolean) => void
  newSubService: Record<string, { name: string; price: string; duration: string }>
  setNewSubService: (updater: any) => void
  editingSubService: Record<
    string,
    {
      name?: string
      price?: string
      duration?: string
      shortDescription?: string
      description?: string
      isActive?: boolean
    }
  >
  setEditingSubService: (updater: any) => void
  onClose: () => void
  onAddSubService: (e: React.FormEvent, serviceId: string) => void
  onDeleteSubService: (subServiceId: string, serviceId: string) => void
  onSaveSubService: (sub: SubServiceAdminItem, serviceId: string) => Promise<void>
  onOpenImages: (serviceId: string, subServiceId: string) => void
}

export function SubServicesModal({
  service,
  subServices,
  mobileSubServiceOpenId,
  setMobileSubServiceOpenId,
  mobileAddSubOpen,
  setMobileAddSubOpen,
  newSubService,
  setNewSubService,
  editingSubService,
  setEditingSubService,
  onClose,
  onAddSubService,
  onDeleteSubService,
  onSaveSubService,
  onOpenImages,
}: Props) {
  const svcId = service.id
  const draftNew = newSubService[svcId] ?? { name: '', price: '', duration: '30' }

  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div className="fixed inset-0 flex items-end justify-center md:items-center md:p-4">
        <div className="flex h-[85vh] w-full flex-col rounded-t-2xl bg-white shadow-xl md:h-auto md:max-h-[85vh] md:max-w-5xl md:rounded-xl">
          <div className="flex items-start justify-between gap-3 border-b border-neutral-200 px-5 py-4">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-neutral-900">Subservicios · {service.name}</h3>
              <p className="mt-1 text-xs text-neutral-500">Variantes con distinto precio/duración y descripciones.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Cerrar
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {/* Mobile UI */}
            <div className="md:hidden">
              <button
                type="button"
                onClick={() => setMobileAddSubOpen(!mobileAddSubOpen)}
                className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Agregar subservicio</p>
                  <p className="mt-0.5 text-xs text-neutral-500">Creá una variante con precio y duración.</p>
                </div>
                <span className="text-xs text-neutral-500">{mobileAddSubOpen ? '▲' : '▼'}</span>
              </button>

              {mobileAddSubOpen && (
                <form
                  onSubmit={(e) => onAddSubService(e, svcId)}
                  className="mt-3 rounded-xl border border-neutral-200 bg-white p-4"
                >
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-neutral-600">Nombre</label>
                      <input
                        type="text"
                        value={draftNew.name ?? ''}
                        onChange={(e) =>
                          setNewSubService((prev: any) => ({
                            ...prev,
                            [svcId]: { ...(prev[svcId] ?? { name: '', price: '', duration: '30' }), name: e.target.value },
                          }))
                        }
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-neutral-600">Precio</label>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={draftNew.price ?? ''}
                          onChange={(e) =>
                            setNewSubService((prev: any) => ({
                              ...prev,
                              [svcId]: { ...(prev[svcId] ?? { name: '', price: '', duration: '30' }), price: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-neutral-600">Duración</label>
                        <input
                          type="number"
                          min={15}
                          max={120}
                          value={draftNew.duration ?? '30'}
                          onChange={(e) =>
                            setNewSubService((prev: any) => ({
                              ...prev,
                              [svcId]: { ...(prev[svcId] ?? { name: '', price: '', duration: '30' }), duration: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
                    >
                      Agregar
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-4">
                {subServices.length === 0 ? (
                  <p className="text-sm text-neutral-500">Todavía no hay subservicios.</p>
                ) : (
                  <div className="space-y-2">
                    {subServices.map((sub) => {
                      const open = mobileSubServiceOpenId === sub.id
                      return (
                        <div key={sub.id} className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
                          <button
                            type="button"
                            onClick={() => setMobileSubServiceOpenId(open ? null : sub.id)}
                            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-neutral-900">{sub.name}</p>
                              <p className="mt-0.5 text-xs text-neutral-500">
                                $ {sub.price} · {sub.duration} min
                              </p>
                            </div>
                            <span className="text-xs text-neutral-500">{open ? '▲' : '▼'}</span>
                          </button>

                          {open && (
                            <div className="border-t border-neutral-200 px-4 py-3">
                              <div className="grid grid-cols-1 gap-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="mb-1 block text-xs font-medium text-neutral-600">Nombre</label>
                                    <input
                                      type="text"
                                      defaultValue={sub.name}
                                      onChange={(e) =>
                                        setEditingSubService((prev: any) => ({
                                          ...prev,
                                          [sub.id]: { ...(prev[sub.id] ?? {}), name: e.target.value },
                                        }))
                                      }
                                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs font-medium text-neutral-600">Precio</label>
                                    <input
                                      type="number"
                                      min={0}
                                      step={0.01}
                                      defaultValue={sub.price}
                                      onChange={(e) =>
                                        setEditingSubService((prev: any) => ({
                                          ...prev,
                                          [sub.id]: { ...(prev[sub.id] ?? {}), price: e.target.value },
                                        }))
                                      }
                                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="mb-1 block text-xs font-medium text-neutral-600">Duración</label>
                                    <input
                                      type="number"
                                      min={15}
                                      max={120}
                                      defaultValue={sub.duration}
                                      onChange={(e) =>
                                        setEditingSubService((prev: any) => ({
                                          ...prev,
                                          [sub.id]: { ...(prev[sub.id] ?? {}), duration: e.target.value },
                                        }))
                                      }
                                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                    />
                                  </div>
                                  <div className="flex items-end justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => onOpenImages(svcId, sub.id)}
                                      className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                                    >
                                      Imágenes
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                  <div>
                                    <label className="mb-1 block text-xs font-medium text-neutral-600">
                                      Descripción corta
                                    </label>
                                    <input
                                      type="text"
                                      defaultValue={sub.shortDescription ?? ''}
                                      onChange={(e) =>
                                        setEditingSubService((prev: any) => ({
                                          ...prev,
                                          [sub.id]: { ...(prev[sub.id] ?? {}), shortDescription: e.target.value },
                                        }))
                                      }
                                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs font-medium text-neutral-600">
                                      Descripción extendida
                                    </label>
                                    <textarea
                                      rows={3}
                                      defaultValue={sub.description ?? ''}
                                      onChange={(e) =>
                                        setEditingSubService((prev: any) => ({
                                          ...prev,
                                          [sub.id]: { ...(prev[sub.id] ?? {}), description: e.target.value },
                                        }))
                                      }
                                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                    />
                                  </div>
                                </div>

                                <div className="flex items-center justify-between gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => void onSaveSubService(sub, svcId)}
                                    className="flex-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
                                  >
                                    Guardar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onDeleteSubService(sub.id, svcId)}
                                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop UI: keep dense layout */}
            <div className="hidden md:block">
              <div className="mt-1 rounded-lg border border-neutral-200 bg-neutral-50/40 p-4">
                <p className="text-sm font-semibold text-neutral-800">Agregar subservicio</p>
                <form onSubmit={(e) => onAddSubService(e, svcId)} className="mt-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-neutral-700">Nombre</label>
                      <input
                        type="text"
                        value={draftNew.name ?? ''}
                        onChange={(e) =>
                          setNewSubService((prev: any) => ({
                            ...prev,
                            [svcId]: { ...(prev[svcId] ?? { name: '', price: '', duration: '30' }), name: e.target.value },
                          }))
                        }
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-neutral-700">Precio</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={draftNew.price ?? ''}
                        onChange={(e) =>
                          setNewSubService((prev: any) => ({
                            ...prev,
                            [svcId]: { ...(prev[svcId] ?? { name: '', price: '', duration: '30' }), price: e.target.value },
                          }))
                        }
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-neutral-700">Duración</label>
                      <input
                        type="number"
                        min={15}
                        max={120}
                        value={draftNew.duration ?? '30'}
                        onChange={(e) =>
                          setNewSubService((prev: any) => ({
                            ...prev,
                            [svcId]: { ...(prev[svcId] ?? { name: '', price: '', duration: '30' }), duration: e.target.value },
                          }))
                        }
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              <div className="mt-4 max-h-[55vh] overflow-auto pr-1">
                {subServices.length === 0 ? (
                  <p className="text-sm text-neutral-500">Todavía no hay subservicios.</p>
                ) : (
                  <div className="space-y-2">
                    {subServices.map((sub) => (
                      <div key={sub.id} className="rounded-lg border border-neutral-200 p-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-neutral-700">Nombre</label>
                            <input
                              type="text"
                              defaultValue={sub.name}
                              onChange={(e) =>
                                setEditingSubService((prev: any) => ({
                                  ...prev,
                                  [sub.id]: { ...(prev[sub.id] ?? {}), name: e.target.value },
                                }))
                              }
                              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-neutral-700">Precio</label>
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              defaultValue={sub.price}
                              onChange={(e) =>
                                setEditingSubService((prev: any) => ({
                                  ...prev,
                                  [sub.id]: { ...(prev[sub.id] ?? {}), price: e.target.value },
                                }))
                              }
                              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-neutral-700">Duración</label>
                            <input
                              type="number"
                              min={15}
                              max={120}
                              defaultValue={sub.duration}
                              onChange={(e) =>
                                setEditingSubService((prev: any) => ({
                                  ...prev,
                                  [sub.id]: { ...(prev[sub.id] ?? {}), duration: e.target.value },
                                }))
                              }
                              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                            />
                          </div>
                          <div className="flex flex-col items-end justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => onOpenImages(svcId, sub.id)}
                              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                            >
                              Imágenes
                            </button>
                            <button
                              type="button"
                              onClick={() => void onSaveSubService(sub, svcId)}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteSubService(sub.id, svcId)}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-neutral-700">Descripción corta</label>
                            <input
                              type="text"
                              defaultValue={sub.shortDescription ?? ''}
                              onChange={(e) =>
                                setEditingSubService((prev: any) => ({
                                  ...prev,
                                  [sub.id]: { ...(prev[sub.id] ?? {}), shortDescription: e.target.value },
                                }))
                              }
                              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-neutral-700">
                              Descripción extendida
                            </label>
                            <textarea
                              rows={3}
                              defaultValue={sub.description ?? ''}
                              onChange={(e) =>
                                setEditingSubService((prev: any) => ({
                                  ...prev,
                                  [sub.id]: { ...(prev[sub.id] ?? {}), description: e.target.value },
                                }))
                              }
                              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

