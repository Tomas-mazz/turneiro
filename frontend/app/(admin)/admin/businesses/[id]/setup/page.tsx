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
  getAdminSubServices,
  createAdminSubService,
  deleteAdminSubService,
  updateAdminService,
  updateAdminSubService,
  getAdminWorkingHours,
  updateAdminWorkingHours,
  getAdminEmployees,
  createAdminEmployee,
  deleteAdminEmployee,
  uploadAdminFile,
} from '@/lib/api'
import type {
  AdminBusinessDetail,
  UpdateBusinessBody,
  ServiceListItem,
  WorkingHoursItem,
  AdminEmployeeListItem,
  SubServiceAdminItem,
} from '@/types'

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
  slotIntervalMinutes: number | ''
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
  const [newService, setNewService] = useState({
    name: '',
    price: '',
    duration: '30',
    isActive: true,
    shortDescription: '',
    description: '',
  })
  const [creatingService, setCreatingService] = useState(false)
  const [subServicesByService, setSubServicesByService] = useState<Record<string, SubServiceAdminItem[]>>({})
  const [newSubService, setNewSubService] = useState<
    Record<string, { name: string; price: string; duration: string; shortDescription: string; description: string }>
  >({})
  const [serviceDescriptionsModalId, setServiceDescriptionsModalId] = useState<string | null>(null)
  const [serviceImagesModalId, setServiceImagesModalId] = useState<string | null>(null)
  const [subServicesModalId, setSubServicesModalId] = useState<string | null>(null)
  const [serviceImagesDraft, setServiceImagesDraft] = useState<string[]>([])
  const [serviceImagesUploading, setServiceImagesUploading] = useState(false)
  const [serviceImagesUploadError, setServiceImagesUploadError] = useState<string | null>(null)
  const [editingServiceShortDesc, setEditingServiceShortDesc] = useState<Record<string, string>>({})
  const [editingServiceDesc, setEditingServiceDesc] = useState<Record<string, string>>({})
  const [editingSubService, setEditingSubService] = useState<
    Record<
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
  >({})
  const [form, setForm] = useState<SetupFormState>({
    paymentRequired: false,
    paymentType: 'FULL',
    depositPercentage: '',
    freeCancellationWindow: 24,
    cancellationHasCost: false,
    lateCancellationFee: '',
    bufferTime: '',
    slotIntervalMinutes: 15,
  })
  const [workingHours, setWorkingHours] = useState<WorkingHoursItem[]>([])
  const [workingHoursLoading, setWorkingHoursLoading] = useState(false)
  const [workingHoursSaving, setWorkingHoursSaving] = useState(false)
  const [workingHoursError, setWorkingHoursError] = useState<string | null>(null)
  const [employees, setEmployees] = useState<AdminEmployeeListItem[]>([])
  const [employeesLoading, setEmployeesLoading] = useState(false)
  const [newEmployeeName, setNewEmployeeName] = useState('')
  const [newEmployeePhotoUrl, setNewEmployeePhotoUrl] = useState<string | null>(null)
  const [newEmployeeEmail, setNewEmployeeEmail] = useState('')
  const [newEmployeePassword, setNewEmployeePassword] = useState('')
  const [employeePhotoUploading, setEmployeePhotoUploading] = useState(false)
  const [ownerSaving, setOwnerSaving] = useState(false)
  const [ownerSaved, setOwnerSaved] = useState(false)
  const [ownerAttends, setOwnerAttends] = useState<'YES' | 'NO' | 'UNSET'>('UNSET')
  const [ownerEmployeeName, setOwnerEmployeeName] = useState('')
  const [ownerEmployeePhotoUrl, setOwnerEmployeePhotoUrl] = useState<string | null>(null)
  const [ownerPhotoUploading, setOwnerPhotoUploading] = useState(false)

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
          slotIntervalMinutes: b.settings?.slotIntervalMinutes ?? 15,
        })
      })
      .catch(() => setError('Negocio no encontrado'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (id && business) {
      setServicesLoading(true)
      getAdminBusinessServices(id)
        .then(async (svc) => {
          setServices(svc)
          // Preload subservices for each service so the admin can see them immediately.
          const entries: Record<string, SubServiceAdminItem[]> = {}
          await Promise.all(
            svc.map(async (s) => {
              try {
                const subs = await getAdminSubServices(s.id)
                entries[s.id] = subs
              } catch {
                entries[s.id] = []
              }
            })
          )
          setSubServicesByService(entries)
        })
        .catch(() => setError('Error al cargar servicios'))
        .finally(() => setServicesLoading(false))
    }
  }, [id, business])

  useEffect(() => {
    if (!serviceImagesModalId) return
    const svc = services.find((x) => x.id === serviceImagesModalId) ?? null
    setServiceImagesDraft(Array.isArray(svc?.images) ? (svc!.images as string[]) : [])
    setServiceImagesUploadError(null)
    setServiceImagesUploading(false)
  }, [serviceImagesModalId, services])

  const handleServiceImagesUpload = async (files: FileList | null) => {
    if (!files || !serviceImagesModalId) return
    const selected = Array.from(files)
    const onlyImages = selected.filter((f) => f.type.startsWith('image/'))
    if (onlyImages.length !== selected.length) {
      setServiceImagesUploadError('Solo se permiten imágenes')
      return
    }
    const remaining = 5 - serviceImagesDraft.length
    if (remaining <= 0) {
      setServiceImagesUploadError('Máximo 5 imágenes')
      return
    }
    const slice = onlyImages.slice(0, remaining)
    setServiceImagesUploadError(null)
    setServiceImagesUploading(true)
    try {
      const uploadedUrls: string[] = []
      for (const f of slice) {
        const { url } = await uploadAdminFile(f)
        uploadedUrls.push(url)
      }
      setServiceImagesDraft((prev) => [...prev, ...uploadedUrls].slice(0, 5))
    } catch {
      setServiceImagesUploadError('Error al subir la imagen')
    } finally {
      setServiceImagesUploading(false)
    }
  }

  useEffect(() => {
    if (!id || !business) return
    if (currentStep !== 4) return
    setWorkingHoursLoading(true)
    getAdminWorkingHours(id)
      .then(setWorkingHours)
      .catch(() => setWorkingHoursError('Error al cargar horarios'))
      .finally(() => setWorkingHoursLoading(false))
  }, [id, business, currentStep])

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
        ...(newService.shortDescription.trim()
          ? { shortDescription: newService.shortDescription.trim() }
          : {}),
        ...(newService.description.trim() ? { description: newService.description.trim() } : {}),
      })
      setServices((prev) => [...prev, service])
      setNewService({
        name: '',
        price: '',
        duration: '30',
        isActive: true,
        shortDescription: '',
        description: '',
      })
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
      setSubServicesByService((prev) => {
        const next = { ...prev }
        delete next[serviceId]
        return next
      })
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null
      setError(msg || 'Error al eliminar servicio')
    }
  }

  const handleAddSubService = async (
    e: React.FormEvent,
    serviceId: string
  ) => {
    e.preventDefault()
    const current =
      newSubService[serviceId] ?? {
        name: '',
        price: '',
        duration: '30',
        shortDescription: '',
        description: '',
      }
    if (!current.name.trim() || !current.price || !current.duration) return
    try {
      const created = await createAdminSubService(serviceId, {
        name: current.name.trim(),
        price: Number(current.price),
        duration: Math.min(120, Math.max(15, Number(current.duration))),
        isActive: true,
        ...(current.shortDescription.trim()
          ? { shortDescription: current.shortDescription.trim() }
          : {}),
        ...(current.description.trim() ? { description: current.description.trim() } : {}),
      })
      setSubServicesByService((prev) => ({
        ...prev,
        [serviceId]: [...(prev[serviceId] ?? []), created],
      }))
      setNewSubService((prev) => ({
        ...prev,
        [serviceId]: {
          name: '',
          price: '',
          duration: '30',
          shortDescription: '',
          description: '',
        },
      }))
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null
      setError(msg || 'Error al crear subservicio')
    }
  }

  const handleDeleteSubService = async (subServiceId: string, serviceId: string) => {
    if (!confirm('¿Eliminar este subservicio?')) return
    try {
      await deleteAdminSubService(subServiceId)
      setSubServicesByService((prev) => ({
        ...prev,
        [serviceId]: (prev[serviceId] ?? []).filter((s) => s.id !== subServiceId),
      }))
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null
      setError(msg || 'Error al eliminar subservicio')
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    const numFields = [
      'depositPercentage',
      'freeCancellationWindow',
      'lateCancellationFee',
      'bufferTime',
      'slotIntervalMinutes',
    ]
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
    slotIntervalMinutes:
      form.slotIntervalMinutes === '' ? undefined : Number(form.slotIntervalMinutes),
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

  useEffect(() => {
    if (!id || !business || currentStep !== 5) return
    setEmployeesLoading(true)
    getAdminEmployees(id)
      .then((list) => {
        setEmployees(list)
        const ownerEmp = list.find((e) => e.isOwner)
        if (ownerEmp) {
          setOwnerAttends('YES')
          setOwnerEmployeeName(ownerEmp.name)
        } else {
          setOwnerAttends('NO')
        }
      })
      .catch(() => setEmployees([]))
      .finally(() => setEmployeesLoading(false))
  }, [id, business, currentStep])

  const handleNewEmployeePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    setEmployeePhotoUploading(true)
    try {
      const { url } = await uploadAdminFile(file)
      setNewEmployeePhotoUrl(url)
    } catch {
      setError('Error al subir la foto del empleado')
    } finally {
      setEmployeePhotoUploading(false)
      e.target.value = ''
    }
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !newEmployeeName.trim()) return
    try {
      const created = await createAdminEmployee(id, {
        name: newEmployeeName.trim(),
        ...(newEmployeePhotoUrl ? { photoUrl: newEmployeePhotoUrl } : {}),
        ...(newEmployeeEmail.trim() && newEmployeePassword.trim()
          ? { staffEmail: newEmployeeEmail.trim(), staffPassword: newEmployeePassword }
          : {}),
      })
      setEmployees((prev) => [...prev, created])
      setNewEmployeeName('')
      setNewEmployeePhotoUrl(null)
      setNewEmployeeEmail('')
      setNewEmployeePassword('')
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null
      setError(msg || 'Error al crear empleado')
    }
  }

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!id) return
    if (!confirm('¿Eliminar este empleado?')) return
    try {
      await deleteAdminEmployee(employeeId)
      setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId))
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null
      setError(msg || 'Error al eliminar empleado')
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
        {business?.slug && (
          <p className="mt-1 text-xs text-neutral-600">
            URL de la tienda: <a href={`https://${business.slug}.turneiro.com`} target="_blank" rel="noopener noreferrer" className="font-medium text-neutral-700 underline hover:text-neutral-900">https://{business.slug}.turneiro.com</a>
          </p>
        )}

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

            <div className="mt-4 w-40">
              <label
                htmlFor="slotIntervalMinutes"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                Intervalo base entre turnos (minutos)
              </label>
              <input
                id="slotIntervalMinutes"
                name="slotIntervalMinutes"
                type="number"
                min={5}
                max={240}
                value={form.slotIntervalMinutes === '' ? '' : form.slotIntervalMinutes}
                onChange={handleChange}
                placeholder="15"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
              />
              <p className="mt-0.5 text-xs text-neutral-500">
                Cada cuánto aparecen los horarios disponibles (ej. 15 = 09:00, 09:15, 09:30...).
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
            Agregá los servicios que ofrece el negocio (nombre, precio, duración) y, cuando sea necesario, variantes dentro de cada servicio (subservicios con distinto precio/duración).
          </p>

          <form onSubmit={handleAddService} className="mt-4 mb-6 rounded-lg border border-neutral-200 bg-neutral-50/40 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
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
              <div>
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
              <div>
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
              <div className="flex items-end gap-3">
                <label className="flex items-center gap-2 pb-2">
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
              </div>
            </div>

            <details className="mt-4 rounded-lg border border-neutral-200 bg-white px-3 py-2">
              <summary className="cursor-pointer select-none text-xs font-semibold text-neutral-700">
                Descripciones (opcional)
              </summary>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="newServiceShortDesc" className="mb-1 block text-xs text-neutral-600">
                    Descripción corta
                  </label>
                  <input
                    id="newServiceShortDesc"
                    type="text"
                    value={newService.shortDescription}
                    onChange={(e) =>
                      setNewService((p) => ({ ...p, shortDescription: e.target.value }))
                    }
                    placeholder="Texto breve que se ve siempre"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="newServiceDesc" className="mb-1 block text-xs text-neutral-600">
                    Descripción extendida
                  </label>
                  <textarea
                    id="newServiceDesc"
                    rows={3}
                    value={newService.description}
                    onChange={(e) => setNewService((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Texto que se mostrará al hacer clic en “Leer más”"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs"
                  />
                </div>
              </div>
            </details>
          </form>

          {servicesLoading ? (
            <p className="text-sm text-neutral-500">Cargando servicios...</p>
          ) : services.length > 0 ? (
            <ul className="mb-4 space-y-3 text-sm">
              {services.map((s) => (
                <li key={s.id} className="rounded bg-neutral-50 px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">
                      {s.name} · $ {s.price} · {s.duration} min
                    </span>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setServiceDescriptionsModalId(s.id)}
                        className="rounded border border-neutral-300 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        Descripciones
                      </button>
                      <button
                        type="button"
                        onClick={() => setServiceImagesModalId(s.id)}
                        className="rounded border border-neutral-300 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        Imágenes
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubServicesModalId(s.id)}
                        className="rounded border border-neutral-300 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        Subservicios
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteService(s.id)}
                        className="text-xs font-medium text-red-600 underline hover:text-red-800"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {/* Service descriptions modal */}
          {serviceDescriptionsModalId && (() => {
            const svc = services.find((x) => x.id === serviceDescriptionsModalId) ?? null
            if (!svc) return null
            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-neutral-900">
                        Descripciones · {svc.name}
                      </h3>
                      <p className="mt-1 text-xs text-neutral-500">
                        La corta se ve siempre; la extendida aparece al tocar “Leer más” en la web.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setServiceDescriptionsModalId(null)}
                      className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      Cerrar
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-neutral-700">
                        Descripción corta
                      </label>
                      <input
                        type="text"
                        defaultValue={(svc as any).shortDescription ?? ''}
                        onChange={(e) =>
                          setEditingServiceShortDesc((prev) => ({
                            ...prev,
                            [svc.id]: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                        placeholder="Texto breve"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-neutral-700">
                        Descripción extendida
                      </label>
                      <textarea
                        rows={4}
                        defaultValue={(svc as any).description ?? ''}
                        onChange={(e) =>
                          setEditingServiceDesc((prev) => ({
                            ...prev,
                            [svc.id]: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                        placeholder="Texto para “Leer más”"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const shortV = (editingServiceShortDesc[svc.id] ?? (svc as any).shortDescription ?? '').trim()
                          const longV = (editingServiceDesc[svc.id] ?? (svc as any).description ?? '').trim()
                          const updated = await updateAdminService(svc.id, {
                            shortDescription: shortV ? shortV : null,
                            description: longV ? longV : null,
                          })
                          setServices((prev) => prev.map((x) => (x.id === svc.id ? updated : x)))
                          setServiceDescriptionsModalId(null)
                        } catch (err: unknown) {
                          const msg =
                            err && typeof err === 'object' && 'response' in err
                              ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
                              : null
                          setError(msg || 'Error al guardar descripciones')
                        }
                      }}
                      className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Service images modal */}
          {serviceImagesModalId && (() => {
            const svc = services.find((x) => x.id === serviceImagesModalId) ?? null
            if (!svc) return null
            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-3xl rounded-xl bg-white p-5 shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-neutral-900">
                        Imágenes · {svc.name}
                      </h3>
                      <p className="mt-1 text-xs text-neutral-500">
                        Máximo 5 imágenes. Se optimizan automáticamente al subirlas.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setServiceImagesModalId(null)}
                      className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      Cerrar
                    </button>
                  </div>

                  <div className="mt-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="text-sm font-medium text-neutral-800">
                        {serviceImagesDraft.length}/5 cargadas
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={serviceImagesUploading || serviceImagesDraft.length >= 5}
                        onChange={(e) => {
                          void handleServiceImagesUpload(e.target.files)
                          e.target.value = ''
                        }}
                        className="block text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200 disabled:opacity-60"
                      />
                    </div>
                    {serviceImagesUploading && (
                      <p className="mt-2 text-sm text-neutral-500">Subiendo...</p>
                    )}
                    {serviceImagesUploadError && (
                      <p className="mt-2 text-sm text-red-600">{serviceImagesUploadError}</p>
                    )}

                    {serviceImagesDraft.length > 0 ? (
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {serviceImagesDraft.map((url) => (
                          <div key={url} className="group relative overflow-hidden rounded-lg border border-neutral-200">
                            <img src={url} alt="Imagen del servicio" className="h-28 w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setServiceImagesDraft((prev) => prev.filter((x) => x !== url))}
                              className="absolute right-2 top-2 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-red-700 shadow hover:bg-white"
                            >
                              Quitar
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-neutral-500">Todavía no hay imágenes cargadas.</p>
                    )}
                  </div>

                  <div className="mt-5 flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={serviceImagesUploading}
                      onClick={async () => {
                        try {
                          const unique = Array.from(new Set(serviceImagesDraft)).slice(0, 5)
                          const updated = await updateAdminService(svc.id, { images: unique })
                          setServices((prev) => prev.map((x) => (x.id === svc.id ? updated : x)))
                          setServiceImagesModalId(null)
                        } catch (err: unknown) {
                          const msg =
                            err && typeof err === 'object' && 'response' in err
                              ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
                              : null
                          setError(msg || 'Error al guardar imágenes')
                        }
                      }}
                      className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Subservices modal */}
          {subServicesModalId && (() => {
            const svc = services.find((x) => x.id === subServicesModalId) ?? null
            if (!svc) return null
            const subs = subServicesByService[svc.id] ?? []
            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-4xl rounded-xl bg-white p-5 shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-neutral-900">
                        Subservicios · {svc.name}
                      </h3>
                      <p className="mt-1 text-xs text-neutral-500">
                        Cada subservicio tiene su precio, duración y descripciones.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSubServicesModalId(null)}
                      className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      Cerrar
                    </button>
                  </div>

                  <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50/40 p-4">
                    <p className="text-sm font-semibold text-neutral-800">Agregar subservicio</p>
                    <form onSubmit={(e) => handleAddSubService(e, svc.id)} className="mt-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-neutral-700">Nombre</label>
                          <input
                            type="text"
                            value={newSubService[svc.id]?.name ?? ''}
                            onChange={(e) =>
                              setNewSubService((prev) => ({
                                ...prev,
                                [svc.id]: {
                                  ...(prev[svc.id] ?? {
                                    name: '',
                                    price: '',
                                    duration: '30',
                                    shortDescription: '',
                                    description: '',
                                  }),
                                  name: e.target.value,
                                },
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
                            value={newSubService[svc.id]?.price ?? ''}
                            onChange={(e) =>
                              setNewSubService((prev) => ({
                                ...prev,
                                [svc.id]: {
                                  ...(prev[svc.id] ?? {
                                    name: '',
                                    price: '',
                                    duration: '30',
                                    shortDescription: '',
                                    description: '',
                                  }),
                                  price: e.target.value,
                                },
                              }))
                            }
                            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-neutral-700">Duración (min)</label>
                          <input
                            type="number"
                            min={15}
                            max={120}
                            value={newSubService[svc.id]?.duration ?? '30'}
                            onChange={(e) =>
                              setNewSubService((prev) => ({
                                ...prev,
                                [svc.id]: {
                                  ...(prev[svc.id] ?? {
                                    name: '',
                                    price: '',
                                    duration: '30',
                                    shortDescription: '',
                                    description: '',
                                  }),
                                  duration: e.target.value,
                                },
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
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-neutral-700">Descripción corta</label>
                          <input
                            type="text"
                            value={newSubService[svc.id]?.shortDescription ?? ''}
                            onChange={(e) =>
                              setNewSubService((prev) => ({
                                ...prev,
                                [svc.id]: {
                                  ...(prev[svc.id] ?? {
                                    name: '',
                                    price: '',
                                    duration: '30',
                                    shortDescription: '',
                                    description: '',
                                  }),
                                  shortDescription: e.target.value,
                                },
                              }))
                            }
                            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-neutral-700">Descripción extendida</label>
                          <textarea
                            rows={3}
                            value={newSubService[svc.id]?.description ?? ''}
                            onChange={(e) =>
                              setNewSubService((prev) => ({
                                ...prev,
                                [svc.id]: {
                                  ...(prev[svc.id] ?? {
                                    name: '',
                                    price: '',
                                    duration: '30',
                                    shortDescription: '',
                                    description: '',
                                  }),
                                  description: e.target.value,
                                },
                              }))
                            }
                            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    </form>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-neutral-800">Subservicios</h4>
                    {subs.length === 0 ? (
                      <p className="mt-2 text-sm text-neutral-500">Todavía no hay subservicios.</p>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {subs.map((sub) => (
                          <div key={sub.id} className="rounded-lg border border-neutral-200 p-4">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                              <div>
                                <label className="mb-1 block text-xs font-medium text-neutral-700">Nombre</label>
                                <input
                                  type="text"
                                  defaultValue={sub.name}
                                  onChange={(e) =>
                                    setEditingSubService((prev) => ({
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
                                    setEditingSubService((prev) => ({
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
                                    setEditingSubService((prev) => ({
                                      ...prev,
                                      [sub.id]: { ...(prev[sub.id] ?? {}), duration: e.target.value },
                                    }))
                                  }
                                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-medium text-neutral-700">Activo</label>
                                <select
                                  defaultValue={sub.isActive ? 'true' : 'false'}
                                  onChange={(e) =>
                                    setEditingSubService((prev) => ({
                                      ...prev,
                                      [sub.id]: { ...(prev[sub.id] ?? {}), isActive: e.target.value === 'true' },
                                    }))
                                  }
                                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                >
                                  <option value="true">Activo</option>
                                  <option value="false">Inactivo</option>
                                </select>
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs font-medium text-neutral-700">Descripción corta</label>
                                <input
                                  type="text"
                                  defaultValue={sub.shortDescription ?? ''}
                                  onChange={(e) =>
                                    setEditingSubService((prev) => ({
                                      ...prev,
                                      [sub.id]: { ...(prev[sub.id] ?? {}), shortDescription: e.target.value },
                                    }))
                                  }
                                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-medium text-neutral-700">Descripción extendida</label>
                                <textarea
                                  rows={3}
                                  defaultValue={sub.description ?? ''}
                                  onChange={(e) =>
                                    setEditingSubService((prev) => ({
                                      ...prev,
                                      [sub.id]: { ...(prev[sub.id] ?? {}), description: e.target.value },
                                    }))
                                  }
                                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                />
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap justify-end gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const changes = editingSubService[sub.id] ?? {}
                                    const body: any = {}
                                    if (changes.name !== undefined) body.name = changes.name.trim()
                                    if (changes.price !== undefined) body.price = Number(changes.price)
                                    if (changes.duration !== undefined) body.duration = Number(changes.duration)
                                    if (changes.isActive !== undefined) body.isActive = changes.isActive
                                    if (changes.shortDescription !== undefined) {
                                      const v = changes.shortDescription.trim()
                                      body.shortDescription = v ? v : null
                                    }
                                    if (changes.description !== undefined) {
                                      const v = changes.description.trim()
                                      body.description = v ? v : null
                                    }
                                    const updated = await updateAdminSubService(sub.id, body)
                                    setSubServicesByService((prev) => ({
                                      ...prev,
                                      [svc.id]: (prev[svc.id] ?? []).map((x) =>
                                        x.id === sub.id ? updated : x
                                      ),
                                    }))
                                    setEditingSubService((prev) => {
                                      const next = { ...prev }
                                      delete next[sub.id]
                                      return next
                                    })
                                  } catch (err: unknown) {
                                    const msg =
                                      err && typeof err === 'object' && 'response' in err
                                        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
                                        : null
                                    setError(msg || 'Error al guardar subservicio')
                                  }
                                }}
                                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
                              >
                                Guardar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSubService(sub.id, svc.id)}
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}

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
            Primero definí si el dueño también atiende clientes, y luego agregá otros empleados del negocio.
          </p>

          {/* Dueño que atiende */}
          <section className="mt-4 mb-6 rounded-lg border border-neutral-200 p-4">
            <h3 className="text-sm font-medium text-neutral-800">
              1. ¿El dueño también atenderá clientes?
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              Si el dueño atiende, se creará un empleado especial para mostrarlo en la página de reservas.
              El acceso al panel usará el email y contraseña del dueño configurados en “Credenciales del dueño”.
            </p>
            <div className="mt-3 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="radio"
                  checked={ownerAttends === 'YES'}
                  onChange={() => setOwnerAttends('YES')}
                  className="text-neutral-900"
                />
                <span>Sí, el dueño también atiende</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="radio"
                  checked={ownerAttends === 'NO'}
                  onChange={() => setOwnerAttends('NO')}
                  className="text-neutral-900"
                />
                <span>No, solo administra</span>
              </label>
            </div>

            {ownerAttends === 'YES' && (
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <div className="w-40">
                  <label className="mb-1 block text-xs text-neutral-600">
                    Nombre del dueño en reservas *
                  </label>
                  <input
                    type="text"
                    value={ownerEmployeeName}
                    onChange={(e) => setOwnerEmployeeName(e.target.value)}
                    placeholder={business?.name ?? 'Ej. Juan (Dueño)'}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="min-w-[180px]">
                  <label className="mb-1 block text-xs text-neutral-600">
                    Foto del dueño (opcional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={ownerPhotoUploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file || !file.type.startsWith('image/')) return
                      setOwnerPhotoUploading(true)
                      try {
                        const { url } = await uploadAdminFile(file)
                        setOwnerEmployeePhotoUrl(url)
                      } catch {
                        setError('Error al subir la foto del dueño')
                      } finally {
                        setOwnerPhotoUploading(false)
                        e.target.value = ''
                      }
                    }}
                    className="block w-full text-xs text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-neutral-700 hover:file:bg-neutral-200"
                  />
                  {ownerPhotoUploading && (
                    <p className="mt-1 text-xs text-neutral-500">Subiendo foto...</p>
                  )}
                  {ownerEmployeePhotoUrl && (
                    <p className="mt-1 text-xs text-green-600">
                      Foto cargada.{' '}
                      <button
                        type="button"
                        onClick={() => setOwnerEmployeePhotoUrl(null)}
                        className="underline"
                      >
                        Quitar
                      </button>
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={!ownerEmployeeName.trim() || !id || ownerSaving}
                  onClick={async () => {
                    if (!id || !ownerEmployeeName.trim()) return
                    setOwnerSaving(true)
                    setOwnerSaved(false)
                    try {
                      await createAdminEmployee(id, {
                        name: ownerEmployeeName.trim(),
                        ...(ownerEmployeePhotoUrl ? { photoUrl: ownerEmployeePhotoUrl } : {}),
                        isOwner: true,
                      })
                      const list = await getAdminEmployees(id)
                      setEmployees(list)
                      setOwnerSaved(true)
                      setTimeout(() => setOwnerSaved(false), 3000)
                    } catch (err: unknown) {
                      const msg =
                        err && typeof err === 'object' && 'response' in err
                          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
                          : null
                      setError(msg || 'Error al guardar dueño que atiende')
                    } finally {
                      setOwnerSaving(false)
                    }
                  }}
                  className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                    ownerSaved ? 'bg-emerald-600' : 'bg-neutral-900 hover:bg-neutral-800'
                  }`}
                >
                  {ownerSaving ? 'Guardando...' : ownerSaved ? 'Guardado' : 'Guardar dueño que atiende'}
                </button>
              </div>
            )}
          </section>

          {/* Otros empleados */}
          <h3 className="mt-4 text-sm font-medium text-neutral-800">2. Otros empleados</h3>
          <p className="mt-1 text-xs text-neutral-500">
            Agregá los empleados del negocio (nombre y foto). Se mostrarán en la página de reservas. Si cargás email y contraseña, también se creará acceso al panel para que gestionen su agenda.
          </p>

          <form
            onSubmit={handleAddEmployee}
            className="mt-4 mb-4 flex flex-wrap items-end gap-3"
          >
            <div className="w-40">
              <label htmlFor="newEmployeeName" className="mb-1 block text-xs text-neutral-600">
                Nombre *
              </label>
              <input
                id="newEmployeeName"
                type="text"
                required
                value={newEmployeeName}
                onChange={(e) => setNewEmployeeName(e.target.value)}
                placeholder="ej. Juan"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="min-w-[180px]">
              <label className="mb-1 block text-xs text-neutral-600">
                Foto (opcional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleNewEmployeePhoto}
                disabled={employeePhotoUploading}
                className="block w-full text-xs text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-neutral-700 hover:file:bg-neutral-200"
              />
              {employeePhotoUploading && (
                <p className="mt-1 text-xs text-neutral-500">Subiendo foto...</p>
              )}
              {newEmployeePhotoUrl && (
                <p className="mt-1 text-xs text-green-600">
                  Foto cargada.{' '}
                  <button
                    type="button"
                    onClick={() => setNewEmployeePhotoUrl(null)}
                    className="underline"
                  >
                    Quitar
                  </button>
                </p>
              )}
            </div>
            <div className="w-40">
              <label
                htmlFor="newEmployeeEmail"
                className="mb-1 block text-xs text-neutral-600"
              >
                Email para acceso al panel (opcional)
              </label>
              <input
                id="newEmployeeEmail"
                type="email"
                value={newEmployeeEmail}
                onChange={(e) => setNewEmployeeEmail(e.target.value)}
                placeholder="empleado@negocio.com"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="w-40">
              <label
                htmlFor="newEmployeePassword"
                className="mb-1 block text-xs text-neutral-600"
              >
                Contraseña (mín. 6 caracteres)
              </label>
              <input
                id="newEmployeePassword"
                type="password"
                value={newEmployeePassword}
                onChange={(e) => setNewEmployeePassword(e.target.value)}
                minLength={6}
                placeholder="••••••••"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={!newEmployeeName.trim()}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              Agregar empleado
            </button>
          </form>

          {employeesLoading ? (
            <p className="text-sm text-neutral-500">Cargando empleados...</p>
          ) : employees.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No hay empleados cargados. Podés agregarlos arriba.
            </p>
          ) : (
            <ul className="mb-4 space-y-1 text-sm">
              {employees.map((emp) => (
                <li
                  key={emp.id}
                  className="flex items-center justify-between rounded bg-neutral-50 px-3 py-2"
                >
                  <span>{emp.name}</span>
                  <button
                    type="button"
                    disabled={emp.isOwner}
                    onClick={() => handleDeleteEmployee(emp.id)}
                    className="text-xs font-medium text-red-600 underline hover:text-red-800 disabled:cursor-not-allowed disabled:text-neutral-400"
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={goToEdit}
              className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Finalizar
            </button>
            <Link
              href={`/admin/businesses/${id}`}
              className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Ir a editar negocio
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
