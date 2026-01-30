'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  getServices,
  updateService,
  getAppointments,
  cancelAppointmentByOwner,
  getGoogleCalendarAuthUrl,
  getGoogleCalendarStatus,
  disconnectGoogleCalendar,
} from '@/lib/api'
import type { ServiceListItem, AppointmentListItem } from '@/types'

const GOOGLE_CALENDAR_URL = 'https://calendar.google.com'

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return format(d, "d MMM yyyy, HH:mm", { locale: es })
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const [services, setServices] = useState<ServiceListItem[]>([])
  const [appointments, setAppointments] = useState<AppointmentListItem[]>([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [loadingAppointments, setLoadingAppointments] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingPrice, setEditingPrice] = useState<Record<string, string>>({})
  const [editingDuration, setEditingDuration] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [cancelModal, setCancelModal] = useState<{ id: string; clientName: string } | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [calendarConnected, setCalendarConnected] = useState<boolean | null>(null)
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [calendarMessage, setCalendarMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    getServices()
      .then(setServices)
      .catch((err) => setError(err.response?.data?.error || 'Error al cargar servicios'))
      .finally(() => setLoadingServices(false))
  }, [])

  useEffect(() => {
    getAppointments()
      .then(setAppointments)
      .catch(() => setAppointments([]))
      .finally(() => setLoadingAppointments(false))
  }, [])

  useEffect(() => {
    getGoogleCalendarStatus()
      .then((data) => setCalendarConnected(data.connected))
      .catch(() => setCalendarConnected(false))
  }, [])

  useEffect(() => {
    const connected = searchParams.get('google_calendar')
    const err = searchParams.get('google_calendar_error')
    if (connected === 'connected') {
      setCalendarMessage({ type: 'success', text: 'Google Calendar conectado correctamente.' })
      setCalendarConnected(true)
      window.history.replaceState({}, '', '/dashboard')
    } else if (err) {
      const messages: Record<string, string> = {
        '1': 'No se pudo conectar Google Calendar. Intentá de nuevo.',
        '2': 'No se recibió autorización. Revocá el acceso y autorizá de nuevo.',
        '3': 'No se encontró calendario. Asegurate de tener Google Calendar habilitado.',
      }
      setCalendarMessage({ type: 'error', text: messages[err] || messages['1'] })
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [searchParams])

  const handleConnectGoogleCalendar = async () => {
    setCalendarLoading(true)
    try {
      const { authUrl } = await getGoogleCalendarAuthUrl()
      window.location.href = authUrl
    } catch (err) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al iniciar la conexión')
      setCalendarLoading(false)
    }
  }

  const handleDisconnectGoogleCalendar = async () => {
    setCalendarLoading(true)
    try {
      await disconnectGoogleCalendar()
      setCalendarConnected(false)
      setCalendarMessage({ type: 'success', text: 'Google Calendar desconectado.' })
    } catch (err) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al desconectar')
    } finally {
      setCalendarLoading(false)
    }
  }

  const upcomingAppointments = appointments.filter((a) => a.status === 'UPCOMING')

  const handleSaveService = async (s: ServiceListItem) => {
    const priceStr = editingPrice[s.id] ?? String(s.price)
    const durationStr = editingDuration[s.id] ?? String(s.duration)
    const price = parseFloat(priceStr)
    const duration = parseInt(durationStr, 10)
    if (Number.isNaN(price) || price <= 0) return
    if (Number.isNaN(duration) || duration < 15 || duration > 120) return
    setSavingId(s.id)
    try {
      const updated = await updateService(s.id, { price, duration })
      setServices((prev) => prev.map((x) => (x.id === s.id ? updated : x)))
      setEditingPrice((prev) => {
        const next = { ...prev }
        delete next[s.id]
        return next
      })
      setEditingDuration((prev) => {
        const next = { ...prev }
        delete next[s.id]
        return next
      })
    } catch (err) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al guardar')
    } finally {
      setSavingId(null)
    }
  }

  const handleCancelAppointment = async () => {
    if (!cancelModal || !cancelReason.trim()) return
    setCancelling(true)
    try {
      await cancelAppointmentByOwner(cancelModal.id, cancelReason.trim())
      setAppointments((prev) => prev.filter((a) => a.id !== cancelModal.id))
      setCancelModal(null)
      setCancelReason('')
    } catch (err) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al cancelar')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <main className="p-8">
      {/* Header: título a la izquierda, Google Calendar a la derecha */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Configuración</h1>
          <p className="mt-1 text-neutral-600">
            Editá precios y duración de tus servicios y cancelá citas con motivo obligatorio.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {calendarConnected ? (
            <>
              <a
                href={GOOGLE_CALENDAR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Ver Google Calendar
              </a>
              <button
                type="button"
                disabled={calendarLoading}
                onClick={handleDisconnectGoogleCalendar}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
              >
                Desconectar
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={calendarLoading}
              onClick={handleConnectGoogleCalendar}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              {calendarLoading ? 'Redirigiendo...' : 'Conectar Google Calendar'}
            </button>
          )}
        </div>
      </div>

      {calendarMessage && (
        <div
          className={`mt-4 rounded-lg border p-3 text-sm ${
            calendarMessage.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {calendarMessage.text}
          <button
            type="button"
            onClick={() => setCalendarMessage(null)}
            className="ml-2 underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-2 underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Servicios */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold text-neutral-900">Servicios (precio y duración)</h2>
        {loadingServices ? (
          <p className="mt-2 text-neutral-500">Cargando servicios...</p>
        ) : services.length === 0 ? (
          <p className="mt-2 text-neutral-500">No hay servicios. El admin debe crearlos.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-200">
            <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-neutral-700">Servicio</th>
                  <th className="px-4 py-3 font-medium text-neutral-700">Precio ($)</th>
                  <th className="px-4 py-3 font-medium text-neutral-700">Duración (min)</th>
                  <th className="px-4 py-3 font-medium text-neutral-700">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {services.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-medium text-neutral-900">{s.name}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-24 rounded border border-neutral-300 px-2 py-1"
                        defaultValue={s.price}
                        onChange={(e) =>
                          setEditingPrice((prev) => ({ ...prev, [s.id]: e.target.value }))
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="15"
                        max="120"
                        className="w-20 rounded border border-neutral-300 px-2 py-1"
                        defaultValue={s.duration}
                        onChange={(e) =>
                          setEditingDuration((prev) => ({ ...prev, [s.id]: e.target.value }))
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={savingId === s.id}
                        onClick={() => handleSaveService(s)}
                        className="rounded bg-neutral-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
                      >
                        {savingId === s.id ? 'Guardando...' : 'Guardar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Cancelar citas */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-neutral-900">Cancelar citas</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Las citas se ven en Google Calendar. Acá podés cancelar con un motivo obligatorio.
        </p>
        {loadingAppointments ? (
          <p className="mt-2 text-neutral-500">Cargando citas...</p>
        ) : upcomingAppointments.length === 0 ? (
          <p className="mt-2 text-neutral-500">No hay citas próximas.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {upcomingAppointments.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white p-3"
              >
                <span className="text-neutral-700">
                  {formatDateTime(a.startTime)} – {a.clientName} – {a.serviceName}
                </span>
                <button
                  type="button"
                  onClick={() => setCancelModal({ id: a.id, clientName: a.clientName })}
                  className="rounded border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
                >
                  Cancelar cita
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Modal cancelar */}
      {cancelModal && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-neutral-900">Cancelar cita</h3>
            <p className="mt-1 text-sm text-neutral-600">
              Cita de <strong>{cancelModal.clientName}</strong>. El motivo es obligatorio.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Motivo de cancelación..."
              rows={3}
              className="mt-4 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCancelModal(null)
                  setCancelReason('')
                }}
                className="rounded border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Cerrar
              </button>
              <button
                type="button"
                disabled={!cancelReason.trim() || cancelling}
                onClick={handleCancelAppointment}
                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {cancelling ? 'Cancelando...' : 'Confirmar cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500">Cargando...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
