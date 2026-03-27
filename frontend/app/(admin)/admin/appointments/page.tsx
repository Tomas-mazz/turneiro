'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  getAdminAppointments,
  getAdminBusinesses,
  adminCancelAppointment,
  adminUpdateAppointmentStatus,
  type AdminAppointmentsQuery,
} from '@/lib/api'
import type {
  AdminAppointmentListItem,
  AdminBusinessListItem,
} from '@/types'

type StatusFilter = 'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED'

const STATUS_LABELS: Record<Exclude<StatusFilter, 'ALL'>, string> = {
  UPCOMING: 'Próximas',
  COMPLETED: 'Completadas',
  CANCELLED: 'Canceladas',
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatReservedDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const now = new Date()
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  const datePart = new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
  }).format(date)
  const timePart = new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
  return `${isToday ? 'Hoy ' : ''}${datePart} - ${timePart}`
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function AdminAppointmentsPage() {
  const [businesses, setBusinesses] = useState<AdminBusinessListItem[]>([])
  const [appointments, setAppointments] = useState<AdminAppointmentListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<{
    businessId: string
    status: StatusFilter
    dateFrom: string
    dateTo: string
  }>({
    businessId: 'ALL',
    status: 'UPCOMING',
    dateFrom: '',
    dateTo: '',
  })

  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null)
  const [cancelSubmitting, setCancelSubmitting] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function loadInitial() {
      setLoading(true)
      setError(null)
      try {
        const [biz, appts] = await Promise.all([
          getAdminBusinesses(),
          getAdminAppointments({ status: 'UPCOMING' }),
        ])
        if (!mounted) return
        setBusinesses(biz)
        setAppointments(appts)
      } catch {
        if (!mounted) return
        setError('Error al cargar las citas')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadInitial()
    return () => {
      mounted = false
    }
  }, [])

  const handleApplyFilters = async () => {
    setLoading(true)
    setError(null)
    try {
      const params: AdminAppointmentsQuery = {}
      if (filters.businessId !== 'ALL') {
        params.businessId = filters.businessId
      }
      if (filters.status !== 'ALL') {
        params.status = filters.status
      }
      if (filters.dateFrom) {
        params.dateFrom = filters.dateFrom
      }
      if (filters.dateTo) {
        params.dateTo = filters.dateTo
      }
      const data = await getAdminAppointments(params)
      setAppointments(data)
    } catch {
      setError('Error al aplicar los filtros')
    } finally {
      setLoading(false)
    }
  }

  const handleResetFilters = async () => {
    setFilters({
      businessId: 'ALL',
      status: 'UPCOMING',
      dateFrom: '',
      dateTo: '',
    })
    await handleApplyFilters()
  }

  const openCancelModal = (id: string) => {
    setCancelTargetId(id)
    setCancelReason('')
    setCancelError(null)
    setCancelModalOpen(true)
  }

  const handleConfirmCancel = async () => {
    if (!cancelTargetId || !cancelReason.trim()) return
    setCancelSubmitting(true)
    setCancelError(null)
    try {
      const result = await adminCancelAppointment(cancelTargetId, cancelReason.trim())
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === result.id
            ? {
                ...a,
                status: 'CANCELLED',
                cancellationReason: cancelReason.trim(),
                paymentStatus: result.refunded ? 'REFUNDED' : a.paymentStatus,
              }
            : a
        )
      )
      setCancelModalOpen(false)
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null
      setCancelError(msg || 'Error al cancelar la cita')
    } finally {
      setCancelSubmitting(false)
    }
  }

  const handleMarkCompleted = async (id: string) => {
    try {
      const result = await adminUpdateAppointmentStatus(id, 'COMPLETED')
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === result.id
            ? {
                ...a,
                status: result.status,
              }
            : a
        )
      )
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null
      setError(msg || 'Error al actualizar el estado de la cita')
    }
  }

  const hasFiltersApplied = useMemo(() => {
    return (
      filters.businessId !== 'ALL' ||
      filters.status !== 'UPCOMING' ||
      !!filters.dateFrom ||
      !!filters.dateTo
    )
  }, [filters])

  return (
    <main className="p-4 pb-10 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-4 border-b border-neutral-200 pb-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:pb-6">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">
            Citas (vista admin)
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Lista centralizada de turnos de todos los negocios. Filtrá por negocio, fecha y estado.
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          ← Volver al panel
        </Link>
      </header>

      <section className="mb-6 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-neutral-900 sm:text-base">
            Filtros
          </h2>
          {hasFiltersApplied && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-medium text-neutral-600 underline hover:text-neutral-900"
            >
              Limpiar filtros
            </button>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-700">
              Negocio
            </label>
            <select
              value={filters.businessId}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, businessId: e.target.value }))
              }
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
            >
              <option value="ALL">Todos los negocios</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-700">
              Estado
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  status: e.target.value as StatusFilter,
                }))
              }
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
            >
              <option value="UPCOMING">Próximas</option>
              <option value="ALL">Todos los estados</option>
              <option value="COMPLETED">Completadas</option>
              <option value="CANCELLED">Canceladas</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-700">
              Desde (fecha)
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
              }
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-700">
              Hasta (fecha)
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
              }
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleApplyFilters}
            className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 transition-all hover:scale-105 hover:bg-emerald-100 disabled:opacity-50 disabled:hover:scale-100"
          >
            Aplicar filtros
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 px-4 py-3 sm:px-6">
          <h2 className="text-base font-semibold text-neutral-900 sm:text-lg">
            Resultados
          </h2>
          <p className="mt-0.5 text-sm text-neutral-500">
            {appointments.length === 0
              ? 'No hay citas para los filtros seleccionados.'
              : `Mostrando ${appointments.length} cita${appointments.length === 1 ? '' : 's'}.`}
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <p className="text-sm text-neutral-500">Cargando citas...</p>
          </div>
        )}

        {!loading && error && (
          <div className="px-4 py-6 sm:px-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && appointments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600 sm:px-6">
                    Reserva
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600 lg:table-cell lg:px-6">
                    Negocio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600 sm:px-6">
                    Cliente
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600 md:table-cell md:px-6">
                    Servicio
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600 md:table-cell md:px-6">
                    Importe
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600 sm:px-6">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-600 sm:px-6">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-neutral-50/50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-800 sm:px-6">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-neutral-500">
                          Reservado: {formatReservedDateTime(apt.createdAt)}
                        </span>
                        <span className="font-medium">
                          Para: {formatDateTime(apt.startTime)}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {apt.clientPhone}
                        </span>
                      </div>
                    </td>
                    <td className="hidden max-w-xs px-4 py-3 text-sm text-neutral-700 lg:table-cell lg:px-6">
                      <span className="line-clamp-2">{apt.businessName}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-800 sm:px-6">
                      <div className="flex flex-col">
                        <span className="font-medium">{apt.clientName}</span>
                        <span className="text-xs text-neutral-500">
                          {apt.serviceName}
                        </span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-neutral-700 md:table-cell md:px-6">
                      {apt.serviceName}
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-neutral-800 md:table-cell md:px-6">
                      {formatPrice(apt.price)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm sm:px-6">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${
                            apt.status === 'UPCOMING'
                              ? 'bg-emerald-50 text-emerald-800'
                              : apt.status === 'COMPLETED'
                              ? 'bg-neutral-200 text-neutral-800'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {apt.status === 'UPCOMING'
                            ? 'Próxima'
                            : apt.status === 'COMPLETED'
                            ? 'Completada'
                            : 'Cancelada'}
                        </span>
                        <span
                          className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${
                            apt.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-800'
                              : apt.paymentStatus === 'REFUNDED'
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-neutral-50 text-neutral-700'
                          }`}
                        >
                          {apt.paymentStatus === 'PAID'
                            ? 'Pagada'
                            : apt.paymentStatus === 'REFUNDED'
                            ? 'Reembolsada'
                            : 'Pendiente'}
                        </span>
                        {apt.status === 'CANCELLED' && apt.cancellationReason && (
                          <span className="max-w-xs text-xs text-neutral-500">
                            Motivo: {apt.cancellationReason}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm sm:px-6">
                      <div className="flex flex-col items-end gap-1 sm:flex-row sm:justify-end sm:gap-2">
                        {apt.status === 'UPCOMING' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleMarkCompleted(apt.id)}
                              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
                            >
                              Marcar como completada
                            </button>
                            <button
                              type="button"
                              onClick={() => openCancelModal(apt.id)}
                              className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                        {apt.status === 'COMPLETED' && (
                          <span className="text-xs text-neutral-400">
                            Sin acciones
                          </span>
                        )}
                        {apt.status === 'CANCELLED' && (
                          <span className="text-xs text-neutral-400">
                            Cancelada
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-neutral-900">
              Cancelar cita
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Ingresá el motivo de la cancelación. El reembolso se procesará según las
              reglas configuradas.
            </p>
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Motivo de cancelación
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
              />
              {cancelError && (
                <p className="mt-2 text-sm text-red-600">{cancelError}</p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={cancelSubmitting}
                onClick={() => setCancelModalOpen(false)}
                className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                Volver
              </button>
              <button
                type="button"
                disabled={cancelSubmitting || !cancelReason.trim()}
                onClick={handleConfirmCancel}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {cancelSubmitting ? 'Cancelando...' : 'Confirmar cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

