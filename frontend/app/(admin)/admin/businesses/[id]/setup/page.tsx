'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  getAdminBusiness,
  updateAdminBusiness,
  getAdminBusinessServices,
  createAdminService,
  deleteAdminService,
  getAdminWorkingHours,
  updateAdminWorkingHours,
} from '@/lib/api'
import type { AdminBusinessDetail, UpdateBusinessBody, ServiceListItem, WorkingHoursItem } from '@/types'

const STEPS = [
  { num: 2, title: 'Reglas de pago y cancelación', slug: 'pago' },
  { num: 3, title: 'Servicios', slug: 'servicios' },
  { num: 4, title: 'Horarios de apertura', slug: 'horarios' },
  { num: 5, title: 'Empleados', slug: 'empleados' },
] as const

type SetupFormState = {
  paymentRequired: boolean
  paymentType: 'PERCENTAGE' | 'FULL'
  depositPercentage: number | ''
  freeCancellationWindow: number | ''
  cancellationHasCost: boolean
  lateCancellationFee: number | ''
  bufferTime: number | ''
}

export default function AdminBusinessSetupPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = params?.id as string
  const stepParam = searchParams?.get('step')
  const currentStep = stepParam ? Math.min(Math.max(2, parseInt(stepParam, 10)), 5) : 2

  const [business, setBusiness] = useState<AdminBusinessDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [services, setServices] = useState<ServiceListItem[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [newService, setNewService] = useState({ name: '', price: '', duration: '30', isActive: true })
  const [creatingService, setCreatingService] = useState(false)
  const [form, setForm] = useState<SetupFormState>({
    paymentRequired: false,
    paymentType: 'FULL',
    depositPercentage: '',
    freeCancellationWindow: 24,
    cancellationHasCost: false,
    lateCancellationFee: '',
    bufferTime: '',
  })
  const [workingHours, setWorkingHours] = useState<WorkingHoursItem[]>([])
  const [workingHoursLoading, setWorkingHoursLoading] = useState(false)
  const [workingHoursSaving, setWorkingHoursSaving] = useState(false)
  const [workingHoursError, setWorkingHoursError] = useState<string | null>(null)

  const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  useEffect(() => {
    if (!id) return
    getAdminBusiness(id)
      .then((b) => {
        setBusiness(b)
        setForm({
          paymentRequired: b.settings?.paymentRequired ?? false,
          paymentType: b.settings?.paymentType === 'PERCENTAGE' ? 'PERCENTAGE' : 'FULL',
          depositPercentage: b.settings?.depositPercentage ?? '',
          freeCancellationWindow: b.settings?.freeCancellationWindow ?? 24,
          cancellationHasCost: b.settings?.cancellationHasCost ?? false,
          lateCancellationFee: b.settings?.lateCancellationFee ?? '',
          bufferTime: b.settings?.bufferTime ?? '',
        })
      })
      .catch(() => setError('Negocio no encontrado'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (id && business) {
      setServicesLoading(true)
      getAdminBusinessServices(id)
        .then(setServices)
        .catch(() => setError('Error al cargar servicios'))
        .finally(() => setServicesLoading(false))
    }
  }, [id, business?.id])

  useEffect(() => {
    if (!id || !business) return
    if (currentStep !== 4) return
    setWorkingHoursLoading(true)
    getAdminWorkingHours(id)
      .then(setWorkingHours)
      .catch(() => setWorkingHoursError('Error al cargar horarios'))
      .finally(() => setWorkingHoursLoading(false))
  }, [id, business?.id, currentStep])

  const handleWorkingHoursChange = (dayOfWeek: number, field: keyof WorkingHoursItem, value: string | boolean | null) => {
    setWorkingHours((prev) =>
      prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h))
    )
  }

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !newService.name.trim() || !newService.price || !newService.duration) return
    setCreatingService(true)
    try {
      const service = await createAdminService(id, {
        name: newService.name.trim(),
        price: Number(newService.price),
        duration: Math.min(120, Math.max(15, Number(newService.duration))),
        isActive: newService.isActive,
      })
      setServices((prev) => [...prev, service])
      setNewService({ name: '', price: '', duration: '30', isActive: true })
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null
      setError(msg || 'Error al crear servicio')
    } finally {
      setCreatingService(false)
    }
  }

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('¿Eliminar este servicio?')) return
    try {
      await deleteAdminService(serviceId)
      setServices((prev) => prev.filter((s) => s.id !== serviceId))
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null
      setError(msg || 'Error al eliminar servicio')
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    const numFields = ['depositPercentage', 'freeCancellationWindow', 'lateCancellationFee', 'bufferTime']
    const parsed = numFields.includes(name)
      ? (value === '' ? '' : (Number(value) || 0))
      : value
    setForm((prev) => ({ ...prev, [name]: parsed }))
  }

  const goToStep = (step: number) => {
    router.push(`/admin/businesses/${id}/setup?step=${step}`)
  }

  const goToEdit = () => {
    router.push(`/admin/businesses/${id}`)
  }

  const buildStep2Body = (): UpdateBusinessBody => ({
    paymentRequired: form.paymentRequired,
    paymentType: form.paymentType,
    freeCancellationWindow: form.freeCancellationWindow === '' ? null : Number(form.freeCancellationWindow),
    cancellationHasCost: form.cancellationHasCost,
    lateCancellationFee: form.cancellationHasCost && form.lateCancellationFee !== ''
      ? Number(form.lateCancellationFee)
      : null,
    bufferTime: form.bufferTime === '' ? null : Number(form.bufferTime),
    ...(form.paymentRequired && { depositPercentage: form.depositPercentage === '' ? null : Number(form.depositPercentage) }),
  })

  const handleSaveStep2 = async (e: React.FormEvent, nextStep: 'step3' | 'edit' = 'step3') => {
    e.preventDefault()
    if (!id) return
    setError(null)
    setSaving(true)
    try {
      await updateAdminBusiness(id, buildStep2Body())
      if (nextStep === 'edit') {
        goToEdit()
      } else {
        goToStep(3)
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null
      setError(msg || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="p-4 pb-10 sm:p-6 lg:p-8">
        <p className="text-neutral-500">Cargando...</p>
      </main>
    )
  }

  if (error && !business) {
    return (
      <main className="p-4 pb-10 sm:p-6 lg:p-8">
        <Link href="/admin" className="text-sm text-neutral-600 underline hover:text-neutral-900">
          ← Volver al panel
        </Link>
        <p className="mt-4 text-red-600">{error}</p>
      </main>
    )
  }

  return (
    <main className="p-4 pb-10 sm:p-6 lg:p-8">
      <header className="mb-6 border-b border-neutral-200 pb-4">
        <Link
          href="/admin"
          className="text-sm text-neutral-600 underline hover:text-neutral-900"
        >
          ← Volver al panel
        </Link>
        <h1 className="mt-2 text-xl font-bold text-neutral-900 sm:text-2xl">
          Configuración del negocio
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {business?.name} · Paso {currentStep} de 5
        </p>

        {/* Progress stepper */}
        <nav className="mt-4 flex flex-wrap gap-2" aria-label="Pasos">
          {STEPS.map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => goToStep(s.num)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                s.num === currentStep
                  ? 'bg-neutral-900 text-white'
                  : s.num < currentStep
                  ? 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                  : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
              }`}
            >
              {s.num}. {s.title}
            </button>
          ))}
        </nav>
      </header>

      {currentStep === 2 && (
        <form
          onSubmit={(e) => handleSaveStep2(e, 'step3')}
          className="space-y-6 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
        >
          {error && (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}

          <fieldset className="rounded-lg border border-neutral-200 p-4">
            <legend className="text-sm font-medium text-neutral-700">
              Reglas de pago y cancelación
            </legend>

            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-neutral-700">Reserva con pago antes de confirmar</p>
              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="paymentRequired"
                    checked={!form.paymentRequired}
                    onChange={() => setForm((p) => ({ ...p, paymentRequired: false }))}
                    className="text-neutral-900"
                  />
                  <span>Sin pago antes de la reserva</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="paymentRequired"
                    checked={form.paymentRequired}
                    onChange={() => setForm((p) => ({ ...p, paymentRequired: true }))}
                    className="text-neutral-900"
                  />
                  <span>Con pago antes de la reserva</span>
                </label>
              </div>
            </div>

            {form.paymentRequired && (
              <div className="mb-4 space-y-3">
                <p className="text-sm font-medium text-neutral-700">Tipo de pago</p>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="paymentType"
                      checked={form.paymentType === 'FULL'}
                      onChange={() => setForm((p) => ({ ...p, paymentType: 'FULL' }))}
                      className="text-neutral-900"
                    />
                    <span>Pago completo</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="paymentType"
                      checked={form.paymentType === 'PERCENTAGE'}
                      onChange={() => setForm((p) => ({ ...p, paymentType: 'PERCENTAGE' }))}
                      className="text-neutral-900"
                    />
                    <span>Depósito (% del total)</span>
                  </label>
                </div>
                {form.paymentType === 'PERCENTAGE' && (
                  <div className="w-40">
                    <label htmlFor="depositPercentage" className="mb-1 block text-sm text-neutral-600">
                      Porcentaje de depósito (%)
                    </label>
                    <input
                      id="depositPercentage"
                      name="depositPercentage"
                      type="number"
                      min={1}
                      max={100}
                      value={form.depositPercentage === '' ? '' : form.depositPercentage}
                      onChange={handleChange}
                      placeholder="ej. 50"
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="mb-4 space-y-3">
              <p className="text-sm font-medium text-neutral-700">Reglas de cancelación</p>
              <div className="flex flex-wrap gap-6">
                <div className="w-32">
                  <label htmlFor="freeCancellationWindow" className="mb-1 block text-sm text-neutral-600">
                    Ventana gratuita (horas antes)
                  </label>
                  <input
                    id="freeCancellationWindow"
                    name="freeCancellationWindow"
                    type="number"
                    min={0}
                    value={form.freeCancellationWindow === '' ? '' : form.freeCancellationWindow}
                    onChange={handleChange}
                    placeholder="24"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
                  />
                </div>
                <div className="flex items-end gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.cancellationHasCost}
                      onChange={(e) => setForm((p) => ({ ...p, cancellationHasCost: e.target.checked }))}
                      className="rounded border-neutral-300 text-neutral-900"
                    />
                    <span className="text-sm text-neutral-600">Cancelación tardía tiene costo</span>
                  </label>
                  {form.cancellationHasCost && (
                    <div className="w-24">
                      <label htmlFor="lateCancellationFee" className="mb-1 block text-sm text-neutral-600">
                        Penalización (%)
                      </label>
                      <input
                        id="lateCancellationFee"
                        name="lateCancellationFee"
                        type="number"
                        min={0}
                        max={100}
                        value={form.lateCancellationFee === '' ? '' : form.lateCancellationFee}
                        onChange={handleChange}
                        placeholder="10"
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="w-40">
              <label htmlFor="bufferTime" className="mb-1 block text-sm font-medium text-neutral-700">
                Buffer entre citas (minutos)
              </label>
              <input
                id="bufferTime"
                name="bufferTime"
                type="number"
                min={0}
                value={form.bufferTime === '' ? '' : form.bufferTime}
                onChange={handleChange}
                placeholder="0"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
              />
              <p className="mt-0.5 text-xs text-neutral-500">
                Tiempo mínimo entre una cita y la siguiente
              </p>
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Siguiente: Servicios'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={(e) => handleSaveStep2(e, 'edit')}
              className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Guardar y configurar después
            </button>
            <Link
              href={`/admin/businesses/${id}`}
              className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Ir a editar negocio
            </Link>
          </div>
        </form>
      )}

      {currentStep === 3 && (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-neutral-900">Servicios</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Agregá los servicios que ofrece el negocio (nombre, precio, duración).
          </p>

          <form onSubmit={handleAddService} className="mt-4 mb-4 flex flex-wrap items-end gap-3">
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
          ) : services.length > 0 ? (
            <ul className="mb-4 space-y-1 text-sm">
              {services.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded bg-neutral-50 px-3 py-2">
                  <span>{s.name} · $ {s.price} · {s.duration} min</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteService(s.id)}
                    className="text-red-600 underline hover:text-red-800"
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => goToStep(4)}
              className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Siguiente: Horarios
            </button>
            <button
              type="button"
              onClick={goToEdit}
              className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-500 hover:bg-neutral-50"
            >
              Configurar después
            </button>
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-neutral-900">Horarios de apertura</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Configurá horario de apertura y cierre por día. Opcional: pausa de almuerzo (inicio y fin).
          </p>
          {workingHoursError && (
            <p className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{workingHoursError}</p>
          )}
          {workingHoursLoading ? (
            <p className="mt-4 text-sm text-neutral-500">Cargando horarios...</p>
          ) : workingHours.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-neutral-600">
                    <th className="py-2">Día</th>
                    <th className="py-2">Cerrado</th>
                    <th className="py-2">Apertura</th>
                    <th className="py-2">Cierre</th>
                    <th className="py-2">Almuerzo inicio</th>
                    <th className="py-2">Almuerzo fin</th>
                  </tr>
                </thead>
                <tbody>
                  {workingHours.map((h) => (
                    <tr key={h.dayOfWeek} className="border-b border-neutral-100">
                      <td className="py-2 font-medium">{DAY_NAMES[h.dayOfWeek]}</td>
                      <td className="py-2">
                        <input
                          type="checkbox"
                          checked={h.isClosed}
                          onChange={(e) => handleWorkingHoursChange(h.dayOfWeek, 'isClosed', e.target.checked)}
                          className="rounded border-neutral-300 text-neutral-900"
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="time"
                          value={h.startTime}
                          onChange={(e) => handleWorkingHoursChange(h.dayOfWeek, 'startTime', e.target.value)}
                          disabled={h.isClosed}
                          className="w-28 rounded border border-neutral-300 px-2 py-1 disabled:bg-neutral-100"
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="time"
                          value={h.endTime}
                          onChange={(e) => handleWorkingHoursChange(h.dayOfWeek, 'endTime', e.target.value)}
                          disabled={h.isClosed}
                          className="w-28 rounded border border-neutral-300 px-2 py-1 disabled:bg-neutral-100"
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="time"
                          value={h.lunchStart ?? ''}
                          onChange={(e) =>
                            handleWorkingHoursChange(h.dayOfWeek, 'lunchStart', e.target.value || null)
                          }
                          disabled={h.isClosed}
                          className="w-28 rounded border border-neutral-300 px-2 py-1 disabled:bg-neutral-100"
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="time"
                          value={h.lunchEnd ?? ''}
                          onChange={(e) =>
                            handleWorkingHoursChange(h.dayOfWeek, 'lunchEnd', e.target.value || null)
                          }
                          disabled={h.isClosed}
                          className="w-28 rounded border border-neutral-300 px-2 py-1 disabled:bg-neutral-100"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={workingHoursLoading || workingHoursSaving}
              onClick={async () => {
                if (!id) return
                setWorkingHoursError(null)
                setWorkingHoursSaving(true)
                try {
                  const payload = workingHours.map(
                    ({ dayOfWeek, startTime, endTime, isClosed, lunchStart, lunchEnd }) => ({
                      dayOfWeek,
                      startTime,
                      endTime,
                      isClosed,
                      lunchStart: lunchStart || null,
                      lunchEnd: lunchEnd || null,
                    })
                  )
                  await updateAdminWorkingHours(id, payload)
                  goToStep(5)
                } catch (err: unknown) {
                  const msg =
                    err && typeof err === 'object' && 'response' in err
                      ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
                      : null
                  setWorkingHoursError(msg || 'Error al guardar horarios')
                } finally {
                  setWorkingHoursSaving(false)
                }
              }}
              className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {workingHoursSaving ? 'Guardando...' : 'Siguiente: Empleados'}
            </button>
            <button
              type="button"
              onClick={() => goToStep(5)}
              className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Omitir y seguir
            </button>
            <button
              type="button"
              onClick={goToEdit}
              className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-500 hover:bg-neutral-50"
            >
              Configurar después
            </button>
          </div>
        </div>
      )}

      {currentStep === 5 && (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-neutral-900">Empleados</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Agregá los empleados del negocio (nombre y foto). Se mostrarán en la página de reservas. Podés configurarlos ahora o más tarde desde la página de edición.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/admin/businesses/${id}#empleados`}
              className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Agregar empleados ahora
            </Link>
            <button
              type="button"
              onClick={goToEdit}
              className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Finalizar
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
