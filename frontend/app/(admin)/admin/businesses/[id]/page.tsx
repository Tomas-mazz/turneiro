'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  getAdminBusiness,
  updateAdminBusiness,
  uploadAdminFile,
  getAdminBusinessServices,
  createAdminService,
  updateAdminService,
  deleteAdminService,
  getAdminWorkingHours,
  updateAdminWorkingHours,
  getAdminBlockedSlots,
  createAdminBlockedSlot,
  deleteAdminBlockedSlot,
  deleteAdminBusiness,
} from '@/lib/api'
import type {
  AdminBusinessDetail,
  UpdateBusinessBody,
  ServiceListItem,
  WorkingHoursItem,
  BlockedSlotListItem,
} from '@/types'

type FormState = Omit<
  UpdateBusinessBody,
  'depositPercentage' | 'freeCancellationWindow' | 'lateCancellationFee' | 'bufferTime' | 'paymentType' | 'cancellationHasCost'
> & {
  paymentType: 'PERCENTAGE' | 'FULL'
  depositPercentage: number | ''
  freeCancellationWindow: number | ''
  cancellationHasCost: boolean
  lateCancellationFee: number | ''
  bufferTime: number | ''
}

export default function AdminBusinessPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [business, setBusiness] = useState<AdminBusinessDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({
    name: '',
    slug: '',
    category: 'barbershop',
    description: '',
    phone: '',
    email: '',
    address: '',
    logo: '',
    coverPhoto: '',
    coverVideo: '',
    theme: 'DARK',
    paymentRequired: false,
    paymentType: 'FULL',
    depositPercentage: '',
    freeCancellationWindow: 24,
    cancellationHasCost: false,
    lateCancellationFee: '',
    bufferTime: '',
    ownerEmail: '',
    ownerPassword: '',
  })
  const [logoUploading, setLogoUploading] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null)
  const [services, setServices] = useState<ServiceListItem[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [newService, setNewService] = useState({ name: '', price: '', duration: '30', isActive: true })
  const [creatingService, setCreatingService] = useState(false)
  const [editingService, setEditingService] = useState<ServiceListItem | null>(null)
  const [workingHours, setWorkingHours] = useState<WorkingHoursItem[]>([])
  const [workingHoursLoading, setWorkingHoursLoading] = useState(false)
  const [workingHoursSaving, setWorkingHoursSaving] = useState(false)
  const [workingHoursError, setWorkingHoursError] = useState<string | null>(null)
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlotListItem[]>([])
  const [loadingBlockedSlots, setLoadingBlockedSlots] = useState(false)
  const [blockDate, setBlockDate] = useState('')
  const [blockType, setBlockType] = useState<'FULL_DAY' | 'TIME_SLOT'>('FULL_DAY')
  const [blockStartTime, setBlockStartTime] = useState('')
  const [blockEndTime, setBlockEndTime] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [blockSubmitting, setBlockSubmitting] = useState(false)
  const [deletingBlockId, setDeletingBlockId] = useState<string | null>(null)
  const [showDeleteBusinessConfirm, setShowDeleteBusinessConfirm] = useState(false)
  const [deletingBusiness, setDeletingBusiness] = useState(false)

  const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  useEffect(() => {
    if (!id) return
    getAdminBusiness(id)
      .then((b) => {
        setBusiness(b)
        setForm({
          name: b.name,
          slug: b.slug,
          category: b.category,
          description: b.description ?? '',
          phone: b.phone ?? '',
          email: b.email ?? '',
          address: b.address ?? '',
          logo: b.logo ?? '',
          coverPhoto: b.coverPhoto ?? '',
          coverVideo: b.coverVideo ?? '',
          theme: (b.theme === 'LIGHT' ? 'LIGHT' : 'DARK') as 'DARK' | 'LIGHT',
          paymentRequired: b.settings?.paymentRequired ?? false,
          paymentType: b.settings?.paymentType === 'PERCENTAGE' ? 'PERCENTAGE' : 'FULL',
          depositPercentage: b.settings?.depositPercentage ?? '',
          freeCancellationWindow: b.settings?.freeCancellationWindow ?? 24,
          cancellationHasCost: b.settings?.cancellationHasCost ?? false,
          lateCancellationFee: b.settings?.lateCancellationFee ?? '',
          bufferTime: b.settings?.bufferTime ?? '',
          ownerEmail: b.owner?.email ?? '',
          ownerPassword: '',
        })
      })
      .catch(() => setError('Negocio no encontrado'))
      .finally(() => setLoading(false))
  }, [id])

  const loadServices = () => {
    if (!id) return
    setServicesLoading(true)
    getAdminBusinessServices(id)
      .then(setServices)
      .catch(() => setError('Error al cargar servicios'))
      .finally(() => setServicesLoading(false))
  }

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
    setWorkingHoursLoading(true)
    getAdminWorkingHours(id)
      .then(setWorkingHours)
      .catch(() => setWorkingHoursError('Error al cargar horarios'))
      .finally(() => setWorkingHoursLoading(false))
  }, [id, business?.id])

  const handleWorkingHoursChange = (dayOfWeek: number, field: keyof WorkingHoursItem, value: string | boolean | null) => {
    setWorkingHours((prev) =>
      prev.map((h) =>
        h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h
      )
    )
  }

  const handleSaveWorkingHours = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setWorkingHoursError(null)
    setWorkingHoursSaving(true)
    try {
      const payload = workingHours.map(({ dayOfWeek, startTime, endTime, isClosed, lunchStart, lunchEnd }) => ({
        dayOfWeek,
        startTime,
        endTime,
        isClosed,
        lunchStart: lunchStart || null,
        lunchEnd: lunchEnd || null,
      }))
      const updated = await updateAdminWorkingHours(id, payload)
      setWorkingHours(updated)
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null
      setWorkingHoursError(msg || 'Error al guardar horarios')
    } finally {
      setWorkingHoursSaving(false)
    }
  }

  useEffect(() => {
    if (!id || !business) return
    setLoadingBlockedSlots(true)
    const from = format(new Date(), 'yyyy-MM-dd')
    const to = format(addDays(new Date(), 60), 'yyyy-MM-dd')
    getAdminBlockedSlots(id, { from, to })
      .then(setBlockedSlots)
      .catch(() => setBlockedSlots([]))
      .finally(() => setLoadingBlockedSlots(false))
  }, [id, business?.id])

  const handleCreateBlock = async () => {
    if (!id || !blockDate.trim()) return
    if (blockType === 'TIME_SLOT' && (!blockStartTime || !blockEndTime)) return
    setBlockSubmitting(true)
    try {
      const body = {
        date: blockDate,
        type: blockType,
        ...(blockType === 'TIME_SLOT' && { startTime: blockStartTime, endTime: blockEndTime }),
        ...(blockReason.trim() && { reason: blockReason.trim() }),
      }
      const created = await createAdminBlockedSlot(id, body)
      setBlockedSlots((prev) => [...prev, created].sort((a, b) => a.date.localeCompare(b.date)))
      setBlockDate('')
      setBlockStartTime('')
      setBlockEndTime('')
      setBlockReason('')
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null
      setError(msg || 'Error al crear bloqueo')
    } finally {
      setBlockSubmitting(false)
    }
  }

  const handleDeleteBlock = async (blockId: string) => {
    setDeletingBlockId(blockId)
    try {
      await deleteAdminBlockedSlot(blockId)
      setBlockedSlots((prev) => prev.filter((b) => b.id !== blockId))
    } catch {
      setError('Error al eliminar bloqueo')
    } finally {
      setDeletingBlockId(null)
    }
  }

  const handleConfirmDeleteBusiness = async () => {
    if (!id) return
    setDeletingBusiness(true)
    try {
      await deleteAdminBusiness(id)
      router.push('/admin')
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null
      setError(msg || 'Error al eliminar el negocio')
      setShowDeleteBusinessConfirm(false)
    } finally {
      setDeletingBusiness(false)
    }
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

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingService) return
    try {
      const updated = await updateAdminService(editingService.id, {
        name: editingService.name,
        price: editingService.price,
        duration: editingService.duration,
        isActive: editingService.isActive,
      })
      setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
      setEditingService(null)
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null
      setError(msg || 'Error al actualizar servicio')
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    const numFields = ['depositPercentage', 'freeCancellationWindow', 'lateCancellationFee', 'bufferTime']
    const parsed = numFields.includes(name)
      ? (value === '' ? '' : (Number(value) || 0))
      : value
    setForm((prev) => ({ ...prev, [name]: parsed }))
  }

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    setLogoUploading(true)
    try {
      const { url } = await uploadAdminFile(file)
      setForm((prev) => ({ ...prev, logo: url }))
    } catch {
      setError('Error al subir el logo')
    } finally {
      setLogoUploading(false)
      e.target.value = ''
    }
  }

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    if (!isVideo && !isImage) {
      setCoverUploadError('Elegí una imagen o un video')
      return
    }
    setCoverUploadError(null)
    setCoverUploading(true)
    try {
      const { url } = await uploadAdminFile(file)
      setForm((prev) => ({
        ...prev,
        coverPhoto: isImage ? url : '',
        coverVideo: isVideo ? url : '',
      }))
    } catch {
      setCoverUploadError('Error al subir el archivo')
    } finally {
      setCoverUploading(false)
      e.target.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setError(null)
    setSaving(true)
    try {
      const body: UpdateBusinessBody = {
        name: form.name?.trim(),
        slug: form.slug?.trim(),
        category: form.category?.trim(),
        paymentRequired: form.paymentRequired,
        paymentType: form.paymentType,
        theme: form.theme,
      }
      if (form.description !== undefined) body.description = (form.description ?? '').toString().trim() || null
      if (form.phone !== undefined) body.phone = (form.phone ?? '').toString().trim() || null
      if (form.email !== undefined) body.email = (form.email ?? '').toString().trim() || null
      if (form.address !== undefined) body.address = (form.address ?? '').toString().trim() || null
      if (form.logo !== undefined) body.logo = form.logo?.trim() || null
      if (form.coverPhoto !== undefined) body.coverPhoto = form.coverPhoto?.trim() || null
      if (form.coverVideo !== undefined) body.coverVideo = form.coverVideo?.trim() || null
      if (form.paymentRequired) {
        body.paymentType = form.paymentType
        body.depositPercentage = form.depositPercentage === '' ? null : Number(form.depositPercentage)
      }
      body.freeCancellationWindow = form.freeCancellationWindow === '' ? null : Number(form.freeCancellationWindow)
      body.cancellationHasCost = form.cancellationHasCost
      body.lateCancellationFee = form.cancellationHasCost && form.lateCancellationFee !== ''
        ? Number(form.lateCancellationFee)
        : null
      body.bufferTime = form.bufferTime === '' ? null : Number(form.bufferTime)
      if (form.ownerEmail !== undefined) body.ownerEmail = form.ownerEmail.trim() || undefined
      if (form.ownerPassword?.trim()) body.ownerPassword = form.ownerPassword

      await updateAdminBusiness(id, body)
      router.push('/admin')
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
          Editar negocio
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {business?.name} · /{business?.slug}
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
      >
        {error && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-neutral-700">
              Nombre del negocio *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
            />
          </div>
          <div>
            <label htmlFor="slug" className="mb-1 block text-sm font-medium text-neutral-700">
              Slug (URL) *
            </label>
            <input
              id="slug"
              name="slug"
              type="text"
              required
              value={form.slug}
              onChange={handleChange}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
            />
            <p className="mt-0.5 text-xs text-neutral-500">
              Página de reservas: /{form.slug || 'slug'}
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="category" className="mb-1 block text-sm font-medium text-neutral-700">
            Categoría *
          </label>
          <select
            id="category"
            name="category"
            required
            value={form.category}
            onChange={handleChange}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
          >
            <option value="barbershop">Barbería</option>
            <option value="salon">Salón</option>
            <option value="spa">Spa</option>
            <option value="other">Otro</option>
          </select>
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-neutral-700">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            value={form.description ?? ''}
            onChange={handleChange}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-neutral-700">
              Teléfono
            </label>
            <input
              id="phone"
              name="phone"
              type="text"
              value={form.phone ?? ''}
              onChange={handleChange}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-neutral-700">
              Email de contacto
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email ?? ''}
              onChange={handleChange}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="address" className="mb-1 block text-sm font-medium text-neutral-700">
            Dirección
          </label>
          <input
            id="address"
            name="address"
            type="text"
            value={form.address ?? ''}
            onChange={handleChange}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Logo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoFile}
            disabled={logoUploading}
            className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200"
          />
          {logoUploading && <p className="mt-1 text-sm text-neutral-500">Subiendo...</p>}
          {(form.logo ?? '') && (
            <p className="mt-1 text-sm text-green-600">
              Logo cargado. <button type="button" onClick={() => setForm((p) => ({ ...p, logo: '' }))} className="underline">Quitar</button>
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Imagen o video de portada
          </label>
          <input
            type="file"
            accept="image/*,video/mp4,video/webm"
            onChange={handleCoverFile}
            disabled={coverUploading}
            className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200"
          />
          {coverUploading && <p className="mt-1 text-sm text-neutral-500">Subiendo...</p>}
          {coverUploadError && <p className="mt-1 text-sm text-red-600">{coverUploadError}</p>}
          {((form.coverPhoto ?? '') || (form.coverVideo ?? '')) && (
            <p className="mt-1 text-sm text-green-600">
              Portada cargada. <button type="button" onClick={() => setForm((p) => ({ ...p, coverPhoto: '', coverVideo: '' }))} className="underline">Quitar</button>
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Tema / fondo de la página
          </label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="theme"
                checked={form.theme === 'DARK'}
                onChange={() => setForm((p) => ({ ...p, theme: 'DARK' }))}
                className="text-neutral-900"
              />
              <span>Tema oscuro</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="theme"
                checked={form.theme === 'LIGHT'}
                onChange={() => setForm((p) => ({ ...p, theme: 'LIGHT' }))}
                className="text-neutral-900"
              />
              <span>Tema claro (fondo blanco)</span>
            </label>
          </div>
        </div>

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
                    onChange={() => setForm((p) => ({ ...p, paymentType: 'FULL' as const }))}
                    className="text-neutral-900"
                  />
                  <span>Pago completo</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="paymentType"
                    checked={form.paymentType === 'PERCENTAGE'}
                    onChange={() => setForm((p) => ({ ...p, paymentType: 'PERCENTAGE' as const }))}
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

        <fieldset id="servicios" className="rounded-lg border border-neutral-200 p-4">
          <legend className="text-sm font-medium text-neutral-700">
            Servicios
          </legend>
          <p className="mb-4 text-xs text-neutral-500">
            Creá, editá o eliminá servicios. El owner solo puede editar precio y duración.
          </p>

          <form onSubmit={handleAddService} className="mb-4 flex flex-wrap items-end gap-3">
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
                        <form
                          onSubmit={handleUpdateService}
                          className="flex flex-wrap items-center gap-3"
                        >
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
                            onChange={(e) => setEditingService((p) => (p ? { ...p, price: Number(e.target.value) } : null))}
                            className="w-20 rounded border border-neutral-300 px-2 py-1 text-sm"
                            required
                          />
                          <input
                            type="number"
                            min={15}
                            max={120}
                            value={editingService.duration}
                            onChange={(e) => setEditingService((p) => (p ? { ...p, duration: Number(e.target.value) } : null))}
                            className="w-16 rounded border border-neutral-300 px-2 py-1 text-sm"
                            required
                          />
                          <label className="flex items-center gap-1 text-sm">
                            <input
                              type="checkbox"
                              checked={editingService.isActive}
                              onChange={(e) => setEditingService((p) => (p ? { ...p, isActive: e.target.checked } : null))}
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
                          onClick={() => handleDeleteService(s.id)}
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

        <fieldset id="horarios" className="rounded-lg border border-neutral-200 p-4">
          <legend className="text-sm font-medium text-neutral-700">
            Horarios de apertura
          </legend>
          <p className="mb-4 text-xs text-neutral-500">
            Configurá horario de apertura y cierre por día. Opcional: pausa de almuerzo (inicio y fin).
          </p>
          {workingHoursError && (
            <p className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{workingHoursError}</p>
          )}
          {workingHoursLoading ? (
            <p className="text-sm text-neutral-500">Cargando horarios...</p>
          ) : workingHours.length === 0 ? (
            <p className="text-sm text-neutral-500">No hay horarios cargados.</p>
          ) : (
            <form onSubmit={handleSaveWorkingHours} className="space-y-3">
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
                          onChange={(e) => handleWorkingHoursChange(h.dayOfWeek, 'lunchStart', e.target.value || null)}
                          disabled={h.isClosed}
                          className="w-28 rounded border border-neutral-300 px-2 py-1 disabled:bg-neutral-100"
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="time"
                          value={h.lunchEnd ?? ''}
                          onChange={(e) => handleWorkingHoursChange(h.dayOfWeek, 'lunchEnd', e.target.value || null)}
                          disabled={h.isClosed}
                          className="w-28 rounded border border-neutral-300 px-2 py-1 disabled:bg-neutral-100"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                type="submit"
                disabled={workingHoursSaving}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {workingHoursSaving ? 'Guardando...' : 'Guardar horarios'}
              </button>
            </form>
          )}
        </fieldset>

        <fieldset id="bloqueos" className="rounded-lg border border-neutral-200 p-4">
          <legend className="text-sm font-medium text-neutral-700">
            Bloquear días u horarios
          </legend>
          <p className="mb-4 text-xs text-neutral-500">
            Bloqueá un día completo o un rango horario para que no aparezcan en la página de reservas.
          </p>
          <div className="mb-4 flex flex-col gap-4 rounded-lg border border-neutral-200 bg-neutral-50/50 p-4 sm:flex-row sm:flex-wrap sm:items-end">
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
              onClick={handleCreateBlock}
              className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
            >
              {blockSubmitting ? 'Bloqueando...' : 'Bloquear'}
            </button>
          </div>
          <div>
            <h3 className="text-sm font-medium text-neutral-700">Bloqueos próximos (60 días)</h3>
            {loadingBlockedSlots ? (
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
                      <span aria-hidden className="text-neutral-400">·</span>
                      <span>
                        {b.type === 'FULL_DAY'
                          ? 'Día completo'
                          : `${b.startTime ?? ''} – ${b.endTime ?? ''}`}
                      </span>
                      {b.reason && (
                        <>
                          <span aria-hidden className="text-neutral-400">·</span>
                          <span className="text-neutral-600">{b.reason}</span>
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={deletingBlockId === b.id}
                      onClick={() => handleDeleteBlock(b.id)}
                      className="shrink-0 rounded border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                    >
                      {deletingBlockId === b.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </fieldset>

        <fieldset className="rounded-lg border border-neutral-200 p-4">
          <legend className="text-sm font-medium text-neutral-700">
            Credenciales del dueño del negocio
          </legend>
          <p className="mb-3 text-xs text-neutral-500">
            Email actual del owner (solo lectura). Para cambiar el email o la contraseña, completá los campos y guardá.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ownerEmail" className="mb-1 block text-sm text-neutral-600">
                Email del owner
              </label>
              <input
                id="ownerEmail"
                name="ownerEmail"
                type="email"
                value={form.ownerEmail ?? ''}
                onChange={handleChange}
                placeholder={business?.owner?.email ? undefined : 'Sin owner asignado'}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
              />
            </div>
            <div>
              <label htmlFor="ownerPassword" className="mb-1 block text-sm text-neutral-600">
                Nueva contraseña (dejar en blanco para no cambiar)
              </label>
              <input
                id="ownerPassword"
                name="ownerPassword"
                type="password"
                value={form.ownerPassword ?? ''}
                onChange={handleChange}
                minLength={6}
                placeholder="••••••••"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
              />
            </div>
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <Link
            href="/admin"
            className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Cancelar
          </Link>
          <a
            href={business ? `/${business.slug}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Ver página de reservas →
          </a>
          <button
            type="button"
            onClick={() => setShowDeleteBusinessConfirm(true)}
            className="ml-auto rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Eliminar negocio
          </button>
        </div>
      </form>

      {showDeleteBusinessConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-business-title"
        >
          <div className="max-w-md rounded-lg border border-neutral-200 bg-white p-6 shadow-lg">
            <h2 id="delete-business-title" className="text-lg font-semibold text-neutral-900">
              Eliminar negocio
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Este negocio se eliminará y no podrás volver atrás. Se borrarán todos los datos: servicios, horarios, bloqueos, citas y credenciales del dueño.
            </p>
            <p className="mt-1 text-sm font-medium text-neutral-900">
              ¿Estás seguro?
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={deletingBusiness}
                onClick={handleConfirmDeleteBusiness}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deletingBusiness ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
              <button
                type="button"
                disabled={deletingBusiness}
                onClick={() => setShowDeleteBusinessConfirm(false)}
                className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
