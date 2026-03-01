'use client'

import { useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import type { Employee } from '../types'

type EmployeeSelectModalProps = {
  isOpen: boolean
  slotTime: string
  employees: Employee[]
  availableEmployeeIds: string[]
  onSelect: (employeeId: string) => void
  onClose: () => void
  isDarkTheme?: boolean
  primaryColor: string
}

/** Employees who have the slot first (creation order), then the rest. */
function orderEmployeesForSlot(
  employees: Employee[],
  availableIds: string[]
): Employee[] {
  const available = employees.filter((e) => availableIds.includes(e.id))
  const unavailable = employees.filter((e) => !availableIds.includes(e.id))
  return [...available, ...unavailable]
}

export function EmployeeSelectModal({
  isOpen,
  slotTime,
  employees,
  availableEmployeeIds,
  onSelect,
  onClose,
  isDarkTheme = true,
  primaryColor,
}: EmployeeSelectModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  const orderedEmployees = useMemo(
    () => orderEmployeesForSlot(employees, availableEmployeeIds),
    [employees, availableEmployeeIds]
  )

  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen && panelRef.current) {
      const firstFocusable = panelRef.current.querySelector<HTMLElement>(
        'button[aria-label="Cerrar"], button:not([disabled])'
      )
      firstFocusable?.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  const bgOverlay = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
  const panelBg = isDarkTheme ? 'bg-neutral-800' : 'bg-white'
  const panelBorder = isDarkTheme ? 'border-neutral-600' : 'border-neutral-200'
  const titleColor = isDarkTheme ? 'text-white' : 'text-neutral-900'
  const cardBg = isDarkTheme ? 'bg-neutral-700/80 hover:bg-neutral-600' : 'bg-neutral-100 hover:bg-neutral-200'
  const cardDisabled = isDarkTheme ? 'bg-neutral-800/60 text-neutral-500 cursor-default' : 'bg-neutral-100 text-neutral-500 cursor-default'
  const avatarBg = isDarkTheme ? 'bg-neutral-600 text-neutral-200' : 'bg-neutral-300 text-neutral-700'
  const closeBtn = isDarkTheme
    ? 'border-neutral-500 text-neutral-300 hover:bg-neutral-600 hover:text-white'
    : 'border-neutral-400 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-800'

  return (
    <div
      className={bgOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="employee-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        className={`w-full max-w-md rounded-2xl border p-6 shadow-xl ${panelBg} ${panelBorder}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="employee-modal-title" className={`text-lg font-semibold ${titleColor}`}>
            Horario {slotTime} — Elegí empleado
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors ${closeBtn}`}
            aria-label="Cerrar"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>
        <ul className="flex flex-col gap-3">
          {orderedEmployees.map((emp) => {
            const available = availableEmployeeIds.includes(emp.id)
            return (
              <li key={emp.id}>
                {available ? (
                  <button
                    type="button"
                    onClick={() => onSelect(emp.id)}
                    className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-colors ${cardBg}`}
                    style={{ borderColor: primaryColor }}
                  >
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full text-lg font-medium ${avatarBg}`}
                    >
                      {emp.photoUrl ? (
                        <Image
                          src={emp.photoUrl}
                          alt=""
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      ) : (
                        emp.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className={`font-medium ${titleColor}`}>{emp.name}</span>
                  </button>
                ) : (
                  <div
                    className={`flex w-full items-center gap-4 rounded-xl border p-4 ${cardDisabled}`}
                    aria-disabled="true"
                  >
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full text-lg font-medium opacity-70 ${avatarBg}`}
                    >
                      {emp.photoUrl ? (
                        <Image
                          src={emp.photoUrl}
                          alt=""
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      ) : (
                        emp.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <span className={`font-medium ${titleColor}`}>{emp.name}</span>
                      <span className="text-sm text-neutral-500">Sin turno disponible</span>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
