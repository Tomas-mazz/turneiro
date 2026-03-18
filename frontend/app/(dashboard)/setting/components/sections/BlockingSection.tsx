'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type React from 'react'
import type { BlockedSlotListItem } from '@/types'

type Props = {
  visible: boolean
  actsAsOwner: boolean
  blockedSlots: BlockedSlotListItem[]
  loading: boolean
  deletingId: string | null
  onDelete: (id: string) => void

  blockDate: string
  setBlockDate: React.Dispatch<React.SetStateAction<string>>
  blockType: 'FULL_DAY' | 'TIME_SLOT'
  setBlockType: React.Dispatch<React.SetStateAction<'FULL_DAY' | 'TIME_SLOT'>>
  blockStartTime: string
  setBlockStartTime: React.Dispatch<React.SetStateAction<string>>
  blockEndTime: string
  setBlockEndTime: React.Dispatch<React.SetStateAction<string>>
  blockReason: string
  setBlockReason: React.Dispatch<React.SetStateAction<string>>
  blockSubmitting: boolean
  onCreate: () => void

  blockScope: 'BUSINESS' | 'SELF'
  setBlockScope: React.Dispatch<React.SetStateAction<'BUSINESS' | 'SELF'>>
}

export function BlockingSection({
  visible,
  actsAsOwner,
  blockedSlots,
  loading,
  deletingId,
  onDelete,
  blockDate,
  setBlockDate,
  blockType,
  setBlockType,
  blockStartTime,
  setBlockStartTime,
  blockEndTime,
  setBlockEndTime,
  blockReason,
  setBlockReason,
  blockSubmitting,
  onCreate,
  blockScope,
  setBlockScope,
}: Props) {
  if (!visible) return null

  return (
    <section className="mt-8 mb-10 sm:mt-10 sm:mb-12">
      <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">Bloquear días u horarios</h2>
      <p className="mt-1 text-sm text-neutral-600">
        Bloqueá un día completo o un rango horario para que no aparezcan en la página de reservas.
      </p>
      <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50/50 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Fecha</label>
            <input
              type="date"
              value={blockDate}
              onChange={(e) => setBlockDate(e.target.value)}
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <span className="mb-1 block text-xs font-medium text-neutral-600">Tipo</span>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="blockType"
                  checked={blockType === 'FULL_DAY'}
                  onChange={() => setBlockType('FULL_DAY')}
                  className="rounded-full border-neutral-300"
                />
                <span className="text-sm">Día completo</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="blockType"
                  checked={blockType === 'TIME_SLOT'}
                  onChange={() => setBlockType('TIME_SLOT')}
                  className="rounded-full border-neutral-300"
                />
                <span className="text-sm">Rango horario</span>
              </label>
            </div>
          </div>
          {actsAsOwner && (
            <div>
              <span className="mb-1 block text-xs font-medium text-neutral-600">Aplicar a</span>
              <div className="flex gap-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="blockScope"
                    checked={blockScope === 'BUSINESS'}
                    onChange={() => setBlockScope('BUSINESS')}
                    className="rounded-full border-neutral-300"
                  />
                  <span className="text-sm">Toda la tienda</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="blockScope"
                    checked={blockScope === 'SELF'}
                    onChange={() => setBlockScope('SELF')}
                    className="rounded-full border-neutral-300"
                  />
                  <span className="text-sm">Solo mi calendario</span>
                </label>
              </div>
            </div>
          )}
          {blockType === 'TIME_SLOT' && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">Desde</label>
                <input
                  type="time"
                  value={blockStartTime}
                  onChange={(e) => setBlockStartTime(e.target.value)}
                  className="rounded border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">Hasta</label>
                <input
                  type="time"
                  value={blockEndTime}
                  onChange={(e) => setBlockEndTime(e.target.value)}
                  className="rounded border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
            </>
          )}
          <div className="min-w-0 flex-1 sm:min-w-[180px]">
            <label className="mb-1 block text-xs font-medium text-neutral-600">Motivo (opcional)</label>
            <input
              type="text"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Ej. Vacaciones, almuerzo"
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            disabled={blockSubmitting || !blockDate || (blockType === 'TIME_SLOT' && (!blockStartTime || !blockEndTime))}
            onClick={onCreate}
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-50"
          >
            {blockSubmitting ? 'Bloqueando...' : 'Bloquear'}
          </button>
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-neutral-700">Bloqueos próximos (60 días)</h3>
        {loading ? (
          <p className="mt-2 text-sm text-neutral-500">Cargando...</p>
        ) : blockedSlots.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No hay bloqueos en los próximos 60 días.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {blockedSlots.map((b) => (
              <li
                key={b.id}
                className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 text-neutral-700">
                  <span className="font-medium text-neutral-900">
                    {format(new Date(b.date + 'T12:00:00'), 'd MMM yyyy', { locale: es })}
                  </span>
                  <span aria-hidden className="text-neutral-400">
                    ·
                  </span>
                  <span>{b.type === 'FULL_DAY' ? 'Día completo' : `${b.startTime ?? ''} – ${b.endTime ?? ''}`}</span>
                  {b.reason && (
                    <>
                      <span aria-hidden className="text-neutral-400">
                        ·
                      </span>
                      <span className="text-neutral-600">{b.reason}</span>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  disabled={deletingId === b.id}
                  onClick={() => onDelete(b.id)}
                  className="shrink-0 rounded border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  {deletingId === b.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

