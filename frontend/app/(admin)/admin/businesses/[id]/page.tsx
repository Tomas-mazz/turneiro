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
  getAdminEmployees,
  createAdminEmployee,
  updateAdminEmployee,
  deleteAdminEmployee,
} from '@/lib/api'
import type {
  AdminBusinessDetail,
  UpdateBusinessBody,
  ServiceListItem,
  WorkingHoursItem,
  BlockedSlotListItem,
  AdminEmployeeListItem,
} from '@/types'
import { ServicesFieldset } from './components/ServicesFieldset'

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
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
    coverPhotoMobile: '',
    coverVideoMobile: '',
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
  const [coverDesktopUploading, setCoverDesktopUploading] = useState(false)
  const [coverDesktopUploadError, setCoverDesktopUploadError] = useState<string | null>(null)
  const [coverMobileUploading, setCoverMobileUploading] = useState(false)
  const [coverMobileUploadError, setCoverMobileUploadError] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null)
  const [services, setServices] = useState<ServiceListItem[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [newService, setNewService] = useState({ name: '', price: '', duration: '30', isActive: true })
  const [creatingService, setCreatingService] = useState(false)
  const [editingService, setEditingService] = useState<ServiceListItem | null>(null)
  const [workingHours, setWorkingHours] = useState<WorkingHoursItem[]>([])
  const [workingHoursLoading, setWorkingHoursLoading] = useState(false)
  const [workingHoursSaving, setWorkingHoursSaving] = useState(false)
  const [workingHoursSaved, setWorkingHoursSaved] = useState(false)
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
  const [employees, setEmployees] = useState<AdminEmployeeListItem[]>([])
  const [employeesLoading, setEmployeesLoading] = useState(false)
  const [newEmployeeName, setNewEmployeeName] = useState('')
  const [newEmployeePhotoUrl, setNewEmployeePhotoUrl] = useState<string | null>(null)
  const [newEmployeeEmail, setNewEmployeeEmail] = useState('')
  const [newEmployeePassword, setNewEmployeePassword] = useState('')
  const [employeePhotoUploading, setEmployeePhotoUploading] = useState(false)
  const [savingEmployeeId, setSavingEmployeeId] = useState<string | null>(null)
  const [editingEmployee, setEditingEmployee] = useState<AdminEmployeeListItem | null>(null)
  const [businessSaved, setBusinessSaved] = useState(false)
  const [showServiceConfirmModalSaving, setShowServiceConfirmModalSaving] = useState(false)
  const [allowMultipleServicesSaving, setAllowMultipleServicesSaving] = useState(false)

  const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  const getBusinessPublicUrl = (slug: string) => {
    if (typeof window === 'undefined') return `https://${slug}.turneiro.com/`
    const { protocol, hostname } = window.location
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${slug}.localhost:3000/`
    }
    return `${protocol}//${slug}.turneiro.com/`
  }

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
          coverPhotoMobile: b.coverPhotoMobile ?? '',
          coverVideoMobile: b.coverVideoMobile ?? '',
          paymentRequired: b.settings?.paymentRequired ?? false,
          paymentType: b.settings?.paymentType === 'PERCENTAGE' ? 'PERCENTAGE' : 'FULL',
          depositPercentage: b.settings?.depositPercentage ?? '',
          freeCancellationWindow: b.settings?.freeCancellationWindow ?? 24,
          cancellationHasCost: b.settings?.cancellationHasCost ?? false,
          lateCancellationFee: b.settings?.lateCancellationFee ?? '',
          bufferTime: b.settings?.bufferTime ?? '',
          showServiceConfirmModal: b.settings?.showServiceConfirmModal ?? false,
          allowMultipleServices: b.settings?.allowMultipleServices ?? false,
          ownerEmail: b.owner?.email ?? '',
          ownerPassword: '',
        })
      })
      .catch(() => setError('Negocio no encontrado'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id || !business) return
    setEmployeesLoading(true)
    getAdminEmployees(id)
      .then(setEmployees)
      .catch(() => setEmployees([]))
      .finally(() => setEmployeesLoading(false))
  }, [id, business])

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
  }, [id, business])

  useEffect(() => {
    if (!id || !business) return
    setWorkingHoursLoading(true)
    getAdminWorkingHours(id)
      .then(setWorkingHours)
      .catch(() => setWorkingHoursError('Error al cargar horarios'))
      .finally(() => setWorkingHoursLoading(false))
  }, [id, business])

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
    setWorkingHoursSaved(false)
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
      setWorkingHoursSaved(true)
      setTimeout(() => setWorkingHoursSaved(false), 1500)
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
  }, [id, business])

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

  const handleCreateEmployee = async () => {
    if (!id || !newEmployeeName.trim()) return
    setSavingEmployeeId('new')
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
    } finally {
      setSavingEmployeeId(null)
    }
  }

  const handleUpdateEmployee = async (employeeId: string) => {
    if (!editingEmployee || editingEmployee.id !== employeeId) return
    setSavingEmployeeId(employeeId)
    try {
      const updated = await updateAdminEmployee(employeeId, {
        name: editingEmployee.name,
        photoUrl: editingEmployee.photoUrl,
      })
      setEmployees((prev) => prev.map((emp) => (emp.id === updated.id ? updated : emp)))
      setEditingEmployee(null)
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null
      setError(msg || 'Error al actualizar empleado')
    } finally {
      setSavingEmployeeId(null)
    }
  }

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('¿Eliminar este empleado?')) return
    setSavingEmployeeId(employeeId)
    try {
      await deleteAdminEmployee(employeeId)
      setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId))
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null
      setError(msg || 'Error al eliminar empleado')
    } finally {
      setSavingEmployeeId(null)
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
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleCoverDesktopFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    if (!isVideo && !isImage) {
      setCoverDesktopUploadError('Elegí una imagen o un video')
      return
    }
    setCoverDesktopUploadError(null)
    setCoverDesktopUploading(true)
    try {
      const { url } = await uploadAdminFile(file)
      setForm((prev) => ({
        ...prev,
        coverPhoto: isImage ? url : '',
        coverVideo: isVideo ? url : '',
      }))
    } catch {
      setCoverDesktopUploadError('Error al subir el archivo')
    } finally {
      setCoverDesktopUploading(false)
      e.target.value = ''
    }
  }

  const handleCoverMobileFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    if (!isVideo && !isImage) {
      setCoverMobileUploadError('Elegí una imagen o un video')
      return
    }
    setCoverMobileUploadError(null)
    setCoverMobileUploading(true)
    try {
      const { url } = await uploadAdminFile(file)
      setForm((prev) => ({
        ...prev,
        coverPhotoMobile: isImage ? url : '',
        coverVideoMobile: isVideo ? url : '',
      }))
    } catch {
      setCoverMobileUploadError('Error al subir el archivo')
    } finally {
      setCoverMobileUploading(false)
      e.target.value = ''
    }
  }

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setLogoUploadError('Solo se permiten imágenes')
      return
    }
    setLogoUploadError(null)
    setLogoUploading(true)
    try {
      const { url } = await uploadAdminFile(file)
      setForm((prev) => ({ ...prev, logo: url }))
    } catch {
      setLogoUploadError('Error al subir el archivo')
    } finally {
      setLogoUploading(false)
      e.target.value = ''
    }
  }

  const handleSubmit = async () => {
    if (!id) return
    setError(null)
    setFieldErrors({})
    setBusinessSaved(false)
    setSaving(true)
    try {
      const body: UpdateBusinessBody = {
        name: form.name?.trim(),
        slug: form.slug?.trim(),
        category: form.category?.trim(),
        paymentRequired: form.paymentRequired,
        paymentType: form.paymentType,
        theme: 'DARK',
      }
      if (form.description !== undefined) body.description = (form.description ?? '').toString().trim() || null
      if (form.phone !== undefined) body.phone = (form.phone ?? '').toString().trim() || null
      if (form.email !== undefined) body.email = (form.email ?? '').toString().trim() || null
      if (form.address !== undefined) body.address = (form.address ?? '').toString().trim() || null
      if (form.coverPhoto !== undefined) body.coverPhoto = form.coverPhoto?.trim() || null
      if (form.coverVideo !== undefined) body.coverVideo = form.coverVideo?.trim() || null
      if (form.coverPhotoMobile !== undefined) body.coverPhotoMobile = form.coverPhotoMobile?.trim() || null
      if (form.coverVideoMobile !== undefined) body.coverVideoMobile = form.coverVideoMobile?.trim() || null
      if (form.logo !== undefined) body.logo = form.logo?.trim() || null
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
      if (form.showServiceConfirmModal !== undefined) body.showServiceConfirmModal = !!form.showServiceConfirmModal
      if (form.allowMultipleServices !== undefined) body.allowMultipleServices = !!form.allowMultipleServices
      if (form.ownerEmail !== undefined) body.ownerEmail = form.ownerEmail.trim() || undefined
      if (form.ownerPassword?.trim()) body.ownerPassword = form.ownerPassword

      await updateAdminBusiness(id, body)
      setBusinessSaved(true)
      setTimeout(() => router.push('/admin'), 1600)
    } catch (err: unknown) {
      const data =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string; field?: string; details?: { path: (string | number)[]; message: string }[] } } }).response?.data
          : undefined
      const msg = data?.error ?? 'Error al guardar'
      setError(
        data?.details?.length
          ? 'Revisá los campos marcados.'
          : msg
      )
      const next: Record<string, string> = {}
      if (data?.details && Array.isArray(data.details)) {
        for (const d of data.details) {
          const key = typeof d.path?.[0] === 'string' ? d.path[0] : String(d.path?.[0] ?? '')
          if (key && d.message) next[key] = d.message
        }
      }
      if (data?.field && data?.error) next[data.field] = data.error
      setFieldErrors(next)
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

      <div
        className="space-y-6 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
      >
        {error && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}

        <fieldset className="rounded-lg border border-neutral-200 p-4">
          <legend className="text-sm font-medium text-neutral-700">
            Marca y presentación
          </legend>
          <p className="mb-4 text-xs text-neutral-500">
            Nombre, descripción e imagen/video de portada se muestran en la página pública de reservas.
          </p>
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
              className={`w-full rounded-lg border px-3 py-2 focus:ring-1 ${fieldErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:border-neutral-500 focus:ring-neutral-500'}`}
            />
            {fieldErrors.name && (
              <p className="mt-0.5 text-sm text-red-600" role="alert">{fieldErrors.name}</p>
            )}
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
              className={`w-full rounded-lg border px-3 py-2 focus:ring-1 ${fieldErrors.slug ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:border-neutral-500 focus:ring-neutral-500'}`}
            />
            {fieldErrors.slug && (
              <p className="mt-0.5 text-sm text-red-600" role="alert">{fieldErrors.slug}</p>
            )}
            <p className="mt-0.5 text-xs text-neutral-500">
              Página de reservas: https://{(form.slug || 'slug').trim()}.turneiro.com
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
            className={`w-full rounded-lg border px-3 py-2 focus:ring-1 ${fieldErrors.category ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:border-neutral-500 focus:ring-neutral-500'}`}
          >
            <option value="barbershop">Barbería</option>
            <option value="salon">Salón</option>
            <option value="wellness">Wellness / estética</option>
            <option value="spa">Spa</option>
            <option value="other">Otro</option>
          </select>
          {fieldErrors.category && (
            <p className="mt-0.5 text-sm text-red-600" role="alert">{fieldErrors.category}</p>
          )}
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
            className={`w-full rounded-lg border px-3 py-2 focus:ring-1 ${fieldErrors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:border-neutral-500 focus:ring-neutral-500'}`}
          />
          {fieldErrors.description && (
            <p className="mt-0.5 text-sm text-red-600" role="alert">{fieldErrors.description}</p>
          )}
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
              className={`w-full rounded-lg border px-3 py-2 focus:ring-1 ${fieldErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:border-neutral-500 focus:ring-neutral-500'}`}
            />
            {fieldErrors.phone && (
              <p className="mt-0.5 text-sm text-red-600" role="alert">{fieldErrors.phone}</p>
            )}
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
              className={`w-full rounded-lg border px-3 py-2 focus:ring-1 ${fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:border-neutral-500 focus:ring-neutral-500'}`}
            />
            {fieldErrors.email && (
              <p className="mt-0.5 text-sm text-red-600" role="alert">{fieldErrors.email}</p>
            )}
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
            className={`w-full rounded-lg border px-3 py-2 focus:ring-1 ${fieldErrors.address ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:border-neutral-500 focus:ring-neutral-500'}`}
          />
          {fieldErrors.address && (
            <p className="mt-0.5 text-sm text-red-600" role="alert">{fieldErrors.address}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Imagen o video de portada (desktop)
            </label>
            <input
              type="file"
              accept="image/*,video/mp4,video/webm"
              onChange={handleCoverDesktopFile}
              disabled={coverDesktopUploading}
              className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200"
            />
            {coverDesktopUploading && <p className="mt-1 text-sm text-neutral-500">Subiendo...</p>}
            {coverDesktopUploadError && <p className="mt-1 text-sm text-red-600">{coverDesktopUploadError}</p>}
            {((form.coverPhoto ?? '') || (form.coverVideo ?? '')) && (
              <p className="mt-1 text-sm text-green-600">
                Portada desktop cargada. <button type="button" onClick={() => setForm((p) => ({ ...p, coverPhoto: '', coverVideo: '' }))} className="underline">Quitar</button>
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Imagen o video de portada (mobile)
            </label>
            <p className="mb-2 text-xs text-neutral-500">
              Si no se sube, se usará la de desktop.
            </p>
            <input
              type="file"
              accept="image/*,video/mp4,video/webm"
              onChange={handleCoverMobileFile}
              disabled={coverMobileUploading}
              className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200"
            />
            {coverMobileUploading && <p className="mt-1 text-sm text-neutral-500">Subiendo...</p>}
            {coverMobileUploadError && <p className="mt-1 text-sm text-red-600">{coverMobileUploadError}</p>}
            {((form.coverPhotoMobile ?? '') || (form.coverVideoMobile ?? '')) && (
              <p className="mt-1 text-sm text-green-600">
                Portada mobile cargada. <button type="button" onClick={() => setForm((p) => ({ ...p, coverPhotoMobile: '', coverVideoMobile: '' }))} className="underline">Quitar</button>
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Logo del negocio
          </label>
          <p className="mb-2 text-xs text-neutral-500">
            Aparecerá en el header de la página y como ícono de carga.
          </p>
          {form.logo && (
            <div className="mb-3 flex items-center gap-4">
              <img
                src={form.logo}
                alt="Logo"
                className="h-16 w-16 rounded-full object-cover border border-neutral-200"
              />
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, logo: '' }))}
                className="text-sm text-red-600 hover:text-red-700 underline"
              >
                Quitar logo
              </button>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoFile}
            disabled={logoUploading}
            className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200"
          />
          {logoUploading && <p className="mt-1 text-sm text-neutral-500">Subiendo...</p>}
          {logoUploadError && <p className="mt-1 text-sm text-red-600">{logoUploadError}</p>}
        </div>

        </fieldset>

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

        <ServicesFieldset
          showServiceConfirmModal={!!form.showServiceConfirmModal}
          showServiceConfirmModalSaving={showServiceConfirmModalSaving}
          onToggleShowConfirm={async (next) => {
            if (!id) return
            setForm((p) => ({ ...p, showServiceConfirmModal: next }))
            setShowServiceConfirmModalSaving(true)
            try {
              await updateAdminBusiness(id, { showServiceConfirmModal: next })
            } catch (err: unknown) {
              setForm((p) => ({ ...p, showServiceConfirmModal: !next }))
              const msg =
                err && typeof err === 'object' && 'response' in err
                  ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
                  : null
              setError(msg || 'Error al guardar la configuración')
            } finally {
              setShowServiceConfirmModalSaving(false)
            }
          }}
          allowMultipleServices={!!form.allowMultipleServices}
          allowMultipleServicesSaving={allowMultipleServicesSaving}
          onToggleAllowMultipleServices={async (next) => {
            if (!id) return
            setForm((p) => ({ ...p, allowMultipleServices: next }))
            setAllowMultipleServicesSaving(true)
            try {
              await updateAdminBusiness(id, { allowMultipleServices: next })
            } catch (err: unknown) {
              setForm((p) => ({ ...p, allowMultipleServices: !next }))
              const msg =
                err && typeof err === 'object' && 'response' in err
                  ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
                  : null
              setError(msg || 'Error al guardar la configuración')
            } finally {
              setAllowMultipleServicesSaving(false)
            }
          }}
          newService={newService}
          setNewService={setNewService}
          creatingService={creatingService}
          onAddService={handleAddService}
          servicesLoading={servicesLoading}
          services={services}
          editingService={editingService}
          setEditingService={setEditingService}
          onUpdateService={handleUpdateService}
          onDeleteService={handleDeleteService}
        />

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
                className={`inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 transition-all hover:scale-105 hover:bg-emerald-100 disabled:opacity-50 disabled:hover:scale-100 ${workingHoursSaved ? 'animate-pulse' : ''}`}
              >
                {workingHoursSaving ? 'Guardando...' : workingHoursSaved ? 'Guardado' : 'Guardar horarios'}
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
            Empleados
          </legend>
          <p className="mb-3 text-xs text-neutral-500">
            Agregá empleados para mostrar en la página pública (nombre y foto). El empleado que representa al propietario del negocio no se puede eliminar.
          </p>

          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="w-48">
              <label
                htmlFor="newEmployeeName"
                className="mb-1 block text-xs text-neutral-600"
              >
                Nombre del empleado *
              </label>
              <input
                id="newEmployeeName"
                type="text"
                value={newEmployeeName}
                onChange={(e) => setNewEmployeeName(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                placeholder="ej. Juan"
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
            <div className="w-48">
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
            <div className="w-48">
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
              type="button"
              onClick={handleCreateEmployee}
              disabled={savingEmployeeId === 'new' || !newEmployeeName.trim()}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 transition-all hover:scale-105 hover:bg-emerald-100 disabled:opacity-50 disabled:hover:scale-100"
            >
              {savingEmployeeId === 'new' ? 'Agregando...' : 'Agregar empleado'}
            </button>
          </div>

          {employeesLoading ? (
            <p className="text-sm text-neutral-500">Cargando empleados...</p>
          ) : employees.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No hay empleados cargados. Podés agregarlos arriba.
            </p>
          ) : (
            <ul className="space-y-3">
              {employees.map((emp) =>
                editingEmployee?.id === emp.id ? (
                  <li
                    key={emp.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50/60 p-3"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-400/20 text-sm font-medium text-amber-500">
                        {editingEmployee.photoUrl
                          ? '📷'
                          : editingEmployee.name.charAt(0).toUpperCase()}
                      </span>
                      <input
                        type="text"
                        value={editingEmployee.name}
                        onChange={(e) =>
                          setEditingEmployee((prev) =>
                            prev ? { ...prev, name: e.target.value } : prev
                          )
                        }
                        className="w-40 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateEmployee(emp.id)}
                        disabled={savingEmployeeId === emp.id}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                      >
                        {savingEmployeeId === emp.id ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingEmployee(null)}
                        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </li>
                ) : (
                  <li
                    key={emp.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2"
                  >
                    <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-xs font-medium text-neutral-600">
                      {emp.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={emp.photoUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        emp.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-sm font-medium text-neutral-900">
                      {emp.name}
                    </span>
                    <div className="ml-auto flex gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingEmployee(emp)}
                        className="rounded-full border border-neutral-300 px-2 py-0.5 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        disabled={savingEmployeeId === emp.id || emp.isOwner}
                        onClick={() => handleDeleteEmployee(emp.id)}
                        className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        {savingEmployeeId === emp.id ? 'Elim...' : 'Eliminar'}
                      </button>
                    </div>
                  </li>
                )
              )}
            </ul>
          )}
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
                className={`w-full rounded-lg border px-3 py-2 focus:ring-1 ${fieldErrors.ownerEmail ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:border-neutral-500 focus:ring-neutral-500'}`}
              />
              {fieldErrors.ownerEmail && (
                <p className="mt-0.5 text-sm text-red-600" role="alert">{fieldErrors.ownerEmail}</p>
              )}
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
                className={`w-full rounded-lg border px-3 py-2 focus:ring-1 ${fieldErrors.ownerPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:border-neutral-500 focus:ring-neutral-500'}`}
              />
              {fieldErrors.ownerPassword && (
                <p className="mt-0.5 text-sm text-red-600" role="alert">{fieldErrors.ownerPassword}</p>
              )}
            </div>
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-300 disabled:opacity-50 ${
              businessSaved
                ? 'scale-105 border-2 border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:scale-105 hover:bg-emerald-100'
            } ${saving && !businessSaved ? 'cursor-wait' : ''}`}
          >
            {saving && !businessSaved ? (
              <>
                <svg className="h-4 w-4 animate-spin shrink-0" viewBox="0 0 24 24" aria-hidden>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" strokeLinecap="round" />
                </svg>
                Guardando...
              </>
            ) : businessSaved ? (
              <>
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Guardado
              </>
            ) : (
              'Guardar cambios'
            )}
          </button>
          <Link
            href="/admin"
            className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Cancelar
          </Link>
          <a
            href={business ? getBusinessPublicUrl(business.slug) : '#'}
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
      </div>

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
