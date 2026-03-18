'use client'

import type React from 'react'
import type { AppointmentListItem } from '@/types'
import { formatDateShort, formatDateTime, groupAppointmentsByDate } from '../../utils/dateFormat'

type Props = {
  visible: boolean
  userRole: string | null
  phoneInput: string
  setPhoneInput: React.Dispatch<React.SetStateAction<string>>
  searchedAppointments: AppointmentListItem[]
  lookupLoading: boolean
  lookupError: string | null
  onLookup: () => void
  onOpenCancel: (a: AppointmentListItem) => void
  onClearResults: () => void
}

export function CancelSection({
  visible,
  userRole,
  phoneInput,
  setPhoneInput,
  searchedAppointments,
  lookupLoading,
  lookupError,
  onLookup,
  onOpenCancel,
  onClearResults,
}: Props) {
  if (!visible) return null

  return (
    <section className="mt-8 sm:mt-10">
      <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">Cancelar turno</h2>
      <p className="mt-1 text-sm text-neutral-600">
        Ingresá el teléfono del cliente para ver sus reservas y cancelar. El motivo es obligatorio. Al cancelar se
        elimina de Google Calendar.
        {userRole === 'STAFF' && (
          <span className="mt-1 block text-neutral-500">Solo ves y podés cancelar los turnos asignados a vos.</span>
        )}
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
        <input
          type="text"
          inputMode="tel"
          value={phoneInput}
          onChange={(e) => {
            const v = e.target.value
            setPhoneInput(v)
            if (!v.trim()) onClearResults()
          }}
          onKeyDown={(e) => e.key === 'Enter' && onLookup()}
          placeholder="Ingresar teléfono del cliente"
          className="min-w-0 flex-1 rounded border border-neutral-300 px-3 py-2.5 text-sm sm:min-w-[200px] sm:flex-none"
        />
        <button
          type="button"
          disabled={lookupLoading || !phoneInput.trim()}
          onClick={onLookup}
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 transition-all hover:scale-105 hover:bg-emerald-100 disabled:opacity-50 disabled:hover:scale-100"
        >
          {lookupLoading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>
      {lookupError && <p className="mt-2 text-sm text-red-600">{lookupError}</p>}
      {searchedAppointments.length > 0 && (() => {
        const grouped = groupAppointmentsByDate(searchedAppointments)
        return (
          <div className="mt-4 space-y-4">
            {grouped.map(([dateKey, list]) => (
              <div key={dateKey}>
                <p className="mb-2 text-sm font-medium text-neutral-700">{formatDateShort(list[0].startTime)}</p>
                {list.map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2 sm:py-2"
                  >
                    <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-1 text-neutral-700 sm:gap-x-3">
                      <span className="font-medium text-neutral-900">{formatDateTime(a.startTime)}</span>
                      <span aria-hidden className="text-neutral-400">
                        ·
                      </span>
                      <span>{a.serviceName}</span>
                      <span aria-hidden className="text-neutral-400">
                        ·
                      </span>
                      <span>{a.clientName}</span>
                      <span aria-hidden className="text-neutral-400">
                        ·
                      </span>
                      <span>{a.clientPhone}</span>
                      <span aria-hidden className="text-neutral-400">
                        ·
                      </span>
                      <span className="font-medium">${a.price}</span>
                    </div>
                    {a.status === 'UPCOMING' ? (
                      <button
                        type="button"
                        onClick={() => onOpenCancel(a)}
                        className="w-full shrink-0 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 transition-colors hover:bg-red-100 sm:w-auto sm:py-1.5"
                      >
                        Cancelar reserva
                      </button>
                    ) : (
                      <span className="shrink-0 text-neutral-500">Cancelada</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )
      })()}
    </section>
  )
}

