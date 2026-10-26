'use client'

import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import type { OwnerEmployeeListItem } from '@/types'

const COLOR_OPTIONS: Array<{ id: string; label: string; hex: string | null }> = [
  { id: '', label: 'Auto (por defecto)', hex: null },
  // Google Calendar color palette (approx). Stored value is the colorId.
  { id: '1', label: 'Lavanda', hex: '#7986CB' },
  { id: '2', label: 'Verde suave', hex: '#33B679' },
  { id: '3', label: 'Violeta', hex: '#8E24AA' },
  { id: '4', label: 'Rosa', hex: '#E67C73' },
  { id: '5', label: 'Amarillo', hex: '#F6BF26' },
  { id: '6', label: 'Naranja', hex: '#F4511E' },
  { id: '7', label: 'Turquesa', hex: '#039BE5' },
  { id: '8', label: 'Gris', hex: '#616161' },
  { id: '9', label: 'Azul', hex: '#3F51B5' },
  { id: '10', label: 'Verde', hex: '#0B8043' },
  { id: '11', label: 'Rojo', hex: '#D50000' },
]

function resolveColorHex(colorId: string): string | null {
  const opt = COLOR_OPTIONS.find((x) => x.id === colorId)
  return opt?.hex ?? null
}

type Editing = {
  name: string
  photoUrl: string
  staffEmail: string
  staffPassword: string
  ownerCalendarColorId: string
  /** Short line shown on the booking page ("Especialista en fades"). */
  bio?: string
}

type Props = {
  visible: boolean
  loading: boolean
  employees: OwnerEmployeeListItem[]
  ownerCalendarColorId: string
  setOwnerCalendarColorId: React.Dispatch<React.SetStateAction<string>>
  savingOwnerColor: boolean
  onSaveOwnerColor: () => void
  creating: boolean
  savingId: string | null
  deletingId: string | null
  newEmployee: Editing
  setNewEmployee: React.Dispatch<React.SetStateAction<Editing>>
  editing: Record<string, Partial<Editing>>
  setEditing: React.Dispatch<React.SetStateAction<Record<string, Partial<Editing>>>>
  onCreate: () => void
  onSave: (emp: OwnerEmployeeListItem) => void
  onDelete: (emp: OwnerEmployeeListItem) => void
  onUploadPhoto: (file: File) => Promise<string>
}

export function EmployeesSection({
  visible,
  loading,
  employees,
  ownerCalendarColorId,
  setOwnerCalendarColorId,
  savingOwnerColor,
  onSaveOwnerColor,
  creating,
  savingId,
  deletingId,
  newEmployee,
  setNewEmployee,
  editing,
  setEditing,
  onCreate,
  onSave,
  onDelete,
  onUploadPhoto,
}: Props) {
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set())

  const employeeIdsKey = useMemo(() => employees.map((e) => e.id).join('|'), [employees])
  useEffect(() => {
    setOpenIds((prev) => {
      const ids = new Set(employees.map((e) => e.id))
      const next = new Set<string>()
      for (const id of prev) {
        if (ids.has(id)) next.add(id)
      }
      return next
    })
  }, [employeeIdsKey, employees])

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!visible) return null

  const ownerHex = resolveColorHex(ownerCalendarColorId)

  return (
    <section className="mt-8 mb-10 sm:mt-10 sm:mb-12">
      <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">Empleados</h2>
      <p className="mt-1 text-sm text-neutral-600">
        Creá y administrá empleados con acceso al panel. También podés elegir el color con el que se ven
        sus turnos en tu Google Calendar.
      </p>

      <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-neutral-900">Tus turnos (dueño)</h3>
        <p className="mt-1 text-xs text-neutral-600">
          Este color se usa en tu Google Calendar para los turnos asignados a vos.
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="flex flex-col gap-1 text-sm text-neutral-800 sm:max-w-sm">
            Color en tu Google Calendar
            <div className="flex items-center gap-2">
              <span
                className="h-5 w-5 rounded border border-neutral-300"
                style={{ backgroundColor: ownerHex ?? 'transparent' }}
                aria-hidden
              />
              <select
                value={ownerCalendarColorId}
                onChange={(e) => setOwnerCalendarColorId(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              >
                {COLOR_OPTIONS.map((o) => (
                  <option key={o.id || 'auto'} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </label>
          <button
            type="button"
            onClick={onSaveOwnerColor}
            disabled={savingOwnerColor}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
          >
            {savingOwnerColor ? 'Guardando...' : 'Guardar color'}
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-neutral-900">Agregar empleado</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-neutral-800">
            Nombre *
            <input
              value={newEmployee.name}
              onChange={(e) => setNewEmployee((p) => ({ ...p, name: e.target.value }))}
              className="rounded-lg border border-neutral-300 px-3 py-2"
              placeholder="Ej. Juan"
            />
          </label>

          <div className="flex flex-col gap-1 text-sm text-neutral-800">
            Foto
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const url = await onUploadPhoto(file)
                    setNewEmployee((p) => ({ ...p, photoUrl: url }))
                    e.target.value = ''
                  }}
                />
                Subir foto
              </label>
              <span className="text-xs text-neutral-500">
                {newEmployee.photoUrl ? 'Foto cargada' : 'Sin foto'}
              </span>
            </div>
          </div>

          <label className="flex flex-col gap-1 text-sm text-neutral-800">
            Email *
            <input
              value={newEmployee.staffEmail}
              onChange={(e) => setNewEmployee((p) => ({ ...p, staffEmail: e.target.value }))}
              className="rounded-lg border border-neutral-300 px-3 py-2"
              placeholder="empleado@tu-negocio.com"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-neutral-800">
            Contraseña * (mín. 6)
            <input
              type="password"
              value={newEmployee.staffPassword}
              onChange={(e) => setNewEmployee((p) => ({ ...p, staffPassword: e.target.value }))}
              className="rounded-lg border border-neutral-300 px-3 py-2"
              placeholder="******"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-neutral-800">
            Color en tu Google Calendar
            <div className="flex items-center gap-2">
              <span
                className="h-5 w-5 rounded border border-neutral-300"
                style={{ backgroundColor: resolveColorHex(newEmployee.ownerCalendarColorId) ?? 'transparent' }}
                aria-hidden
              />
              <select
                value={newEmployee.ownerCalendarColorId}
                onChange={(e) => setNewEmployee((p) => ({ ...p, ownerCalendarColorId: e.target.value }))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              >
                {COLOR_OPTIONS.map((o) => (
                  <option key={o.id || 'auto'} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={onCreate}
              disabled={
                creating ||
                !newEmployee.name.trim() ||
                !newEmployee.staffEmail.trim() ||
                newEmployee.staffPassword.trim().length < 6
              }
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {creating ? 'Agregando...' : 'Agregar'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-medium text-neutral-700">Tus empleados</h3>
        {loading ? (
          <p className="mt-2 text-sm text-neutral-500">Cargando...</p>
        ) : employees.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">Todavía no hay empleados.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {employees.map((emp) => {
              const isOpen = openIds.has(emp.id)
              const ed = editing[emp.id] ?? {}
              const name = ed.name ?? emp.name
              const photoUrl = ed.photoUrl ?? emp.photoUrl ?? ''
              const staffEmail = ed.staffEmail ?? emp.staffEmail ?? ''
              const staffPassword = ed.staffPassword ?? ''
              const bio = ed.bio ?? emp.bio ?? ''
              const ownerCalendarColorId = ed.ownerCalendarColorId ?? (emp.ownerCalendarColorId ?? '')

              const canDelete = true
              const canEditCredentials = true
              const empHex = resolveColorHex(ownerCalendarColorId)

              return (
                <div key={emp.id} className="rounded-lg border border-neutral-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => toggleOpen(emp.id)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-neutral-50"
                    aria-expanded={isOpen}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-medium text-neutral-900">{emp.name}</span>
                        {emp.staffEmail && (
                          <span className="text-sm text-neutral-600 truncate">{emp.staffEmail}</span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                        <span
                          className="h-3.5 w-3.5 rounded border border-neutral-300"
                          style={{ backgroundColor: empHex ?? 'transparent' }}
                          aria-hidden
                        />
                        <span>Color en tu Google Calendar</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-medium text-neutral-700">{isOpen ? 'Cerrar' : 'Editar'}</span>
                      <span aria-hidden className="text-neutral-400">{isOpen ? '▾' : '▸'}</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-neutral-200 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="grid gap-3 md:grid-cols-2">
                            <label className="flex flex-col gap-1 text-sm text-neutral-800">
                              Nombre
                              <input
                                value={name}
                                onChange={(e) =>
                                  setEditing((p) => ({ ...p, [emp.id]: { ...p[emp.id], name: e.target.value } }))
                                }
                                className="rounded-lg border border-neutral-300 px-3 py-2"
                              />
                            </label>

                            <div className="flex flex-col gap-1 text-sm text-neutral-800">
                              Foto
                              <div className="flex items-center gap-2">
                                <label className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0]
                                      if (!file) return
                                      const url = await onUploadPhoto(file)
                                      setEditing((p) => ({ ...p, [emp.id]: { ...p[emp.id], photoUrl: url } }))
                                      e.target.value = ''
                                    }}
                                  />
                                  Subir foto
                                </label>
                                <span className="text-xs text-neutral-500">{photoUrl ? 'Foto cargada' : 'Sin foto'}</span>
                              </div>
                            </div>

                            <label className="flex flex-col gap-1 text-sm text-neutral-800 md:col-span-2">
                              Descripción corta
                              <input
                                value={bio}
                                maxLength={160}
                                placeholder="Ej.: Especialista en fades y barbas"
                                onChange={(e) =>
                                  setEditing((p) => ({ ...p, [emp.id]: { ...p[emp.id], bio: e.target.value } }))
                                }
                                className="rounded-lg border border-neutral-300 px-3 py-2"
                              />
                              <span className="text-xs text-neutral-500">
                                Se muestra en su tarjeta y su perfil en tu página de reservas.
                              </span>
                            </label>

                            <label className="flex flex-col gap-1 text-sm text-neutral-800">
                              Color en tu Google Calendar
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-5 w-5 rounded border border-neutral-300"
                                  style={{ backgroundColor: empHex ?? 'transparent' }}
                                  aria-hidden
                                />
                                <select
                                  value={ownerCalendarColorId}
                                  onChange={(e) =>
                                    setEditing((p) => ({
                                      ...p,
                                      [emp.id]: { ...p[emp.id], ownerCalendarColorId: e.target.value },
                                    }))
                                  }
                                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                                >
                                  {COLOR_OPTIONS.map((o) => (
                                    <option key={o.id || 'auto'} value={o.id}>
                                      {o.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </label>

                            {canEditCredentials && (
                              <>
                                <label className="flex flex-col gap-1 text-sm text-neutral-800">
                                  Email (login)
                                  <input
                                    value={staffEmail}
                                    onChange={(e) =>
                                      setEditing((p) => ({
                                        ...p,
                                        [emp.id]: { ...p[emp.id], staffEmail: e.target.value },
                                      }))
                                    }
                                    className="rounded-lg border border-neutral-300 px-3 py-2"
                                  />
                                </label>

                                <label className="flex flex-col gap-1 text-sm text-neutral-800">
                                  Nueva contraseña (opcional)
                                  <input
                                    type="password"
                                    value={staffPassword}
                                    onChange={(e) =>
                                      setEditing((p) => ({
                                        ...p,
                                        [emp.id]: { ...p[emp.id], staffPassword: e.target.value },
                                      }))
                                    }
                                    className="rounded-lg border border-neutral-300 px-3 py-2"
                                    placeholder="Dejar vacío para mantener"
                                  />
                                </label>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 md:flex-col md:items-stretch">
                          <button
                            type="button"
                            disabled={savingId === emp.id}
                            onClick={() => {
                              onSave(emp)
                              setOpenIds((prev) => {
                                const next = new Set(prev)
                                next.delete(emp.id)
                                return next
                              })
                            }}
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
                          >
                            {savingId === emp.id ? 'Guardando...' : 'Guardar'}
                          </button>
                          <button
                            type="button"
                            disabled={!canDelete || deletingId === emp.id}
                            onClick={() => onDelete(emp)}
                            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                          >
                            {deletingId === emp.id ? 'Eliminando...' : 'Eliminar'}
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
    </section>
  )
}

