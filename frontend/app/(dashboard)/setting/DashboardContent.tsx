'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { getAuthUser, getAdminActingShopSlug } from '@/lib/auth'
import {
  getMyBusiness,
  getServices,
  updateService,
  createService,
  deleteService,
  uploadAdminFile,
  getAdminSubServices,
  createAdminSubService,
  updateAdminSubService,
  deleteAdminSubService,
  getAppointmentsByPhone,
  cancelAppointmentByOwner,
  getGoogleCalendarAuthUrl,
  getGoogleCalendarStatus,
  disconnectGoogleCalendar,
  getBlockedSlots,
  createBlockedSlot,
  deleteBlockedSlot,
  getWorkingHours,
  updateWorkingHours,
  getBusinessSettings,
  updateBusinessSettings,
} from '@/lib/api'
import { ImagesModal } from '@/components/ImagesModal'
import type {
  ServiceListItem,
  AppointmentListItem,
  BlockedSlotListItem,
  WorkingHoursItem,
  SubServiceAdminItem,
} from '@/types'

const GOOGLE_CALENDAR_URL = 'https://calendar.google.com'

type DashboardSection = 'all' | 'services' | 'blocking' | 'hours' | 'cancel'

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return format(d, "d MMM yyyy, HH:mm", { locale: es })
}

function formatDateShort(iso: string) {
  const d = new Date(iso)
  return format(d, 'd/M')
}

function groupAppointmentsByDate(appointments: AppointmentListItem[]) {
  const groups: Record<string, AppointmentListItem[]> = {}
  for (const a of appointments) {
    const key = format(new Date(a.startTime), 'yyyy-MM-dd')
    if (!groups[key]) groups[key] = []
    groups[key].push(a)
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
}

export function DashboardContent({ section = 'all' }: { section?: DashboardSection }) {
  const [businessTitle, setBusinessTitle] = useState<string | null>(null)
  const [businessSlug, setBusinessSlug] = useState<string | null>(null)
  const [services, setServices] = useState<ServiceListItem[]>([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingPrice, setEditingPrice] = useState<Record<string, string>>({})
  const [editingDuration, setEditingDuration] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [justSavedId, setJustSavedId] = useState<string | null>(null)
  const [phoneInput, setPhoneInput] = useState('')
  const [searchedAppointments, setSearchedAppointments] = useState<AppointmentListItem[]>([])
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [cancelModal, setCancelModal] = useState<AppointmentListItem | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlotListItem[]>([])
  const [loadingBlockedSlots, setLoadingBlockedSlots] = useState(true)
  const [blockDate, setBlockDate] = useState('')
  const [blockType, setBlockType] = useState<'FULL_DAY' | 'TIME_SLOT'>('FULL_DAY')
  const [blockStartTime, setBlockStartTime] = useState('')
  const [blockEndTime, setBlockEndTime] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [blockSubmitting, setBlockSubmitting] = useState(false)
  const [deletingBlockId, setDeletingBlockId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [blockScope, setBlockScope] = useState<'BUSINESS' | 'SELF'>('BUSINESS')
  const [newService, setNewService] = useState({ name: '', price: '', duration: '30', isActive: true })
  const [creatingService, setCreatingService] = useState(false)
  const [subServicesByService, setSubServicesByService] = useState<Record<string, SubServiceAdminItem[]>>({})
  const [newSubService, setNewSubService] = useState<
    Record<string, { name: string; price: string; duration: string }>
  >({})
  const [editingServiceName, setEditingServiceName] = useState<Record<string, string>>({})
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
  const [serviceDescriptionsModalId, setServiceDescriptionsModalId] = useState<string | null>(null)
  const [serviceImagesModalId, setServiceImagesModalId] = useState<string | null>(null)
  const [subServicesModalId, setSubServicesModalId] = useState<string | null>(null)
  const [subServiceImagesModal, setSubServiceImagesModal] = useState<{
    serviceId: string
    subServiceId: string
  } | null>(null)
  const [showServiceConfirmModal, setShowServiceConfirmModal] = useState(false)
  const [showServiceConfirmModalSaving, setShowServiceConfirmModalSaving] = useState(false)
  const [workingHours, setWorkingHours] = useState<WorkingHoursItem[]>([])
  const [loadingWorkingHours, setLoadingWorkingHours] = useState(false)
  const [savingWorkingHours, setSavingWorkingHours] = useState(false)
  const [workingHoursError, setWorkingHoursError] = useState<string | null>(null)
  const [workingHoursJustSaved, setWorkingHoursJustSaved] = useState(false)

  useEffect(() => {
    setUserRole(getAuthUser()?.role ?? null)
  }, [])

  const actsAsOwner =
    userRole === 'OWNER' ||
    (userRole === 'ADMIN' && !!getAdminActingShopSlug())

  useEffect(() => {
    getMyBusiness()
      .then((b) => {
        setBusinessTitle(`${b.name} - Configuración`)
        setBusinessSlug(b.slug)
      })
      .catch(() => setBusinessTitle('Configuración'))
  }, [])

  useEffect(() => {
    if (!actsAsOwner) {
      if (userRole === 'STAFF') setLoadingServices(false)
      return
    }
    getServices()
      .then(async (svc) => {
        setServices(svc)
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
      .catch((err) => setError(err.response?.data?.error || 'Error al cargar servicios'))
      .finally(() => setLoadingServices(false))
  }, [userRole, actsAsOwner])

  useEffect(() => {
    if (!actsAsOwner) return
    getBusinessSettings()
      .then((s) => setShowServiceConfirmModal(!!s.showServiceConfirmModal))
      .catch(() => setShowServiceConfirmModal(false))
  }, [actsAsOwner])

  useEffect(() => {
    if (!actsAsOwner) return
    if (!(section === 'all' || section === 'hours')) return
    setLoadingWorkingHours(true)
    getWorkingHours()
      .then(setWorkingHours)
      .catch(() => setWorkingHoursError('Error al cargar horarios'))
      .finally(() => setLoadingWorkingHours(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, section, actsAsOwner])


  const loadBlockedSlots = () => {
    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')
    const to = format(addDays(today, 60), 'yyyy-MM-dd')
    getBlockedSlots({ from: todayStr, to })
      .then((list) => {
        const filtered = list.filter((b) => b.date >= todayStr)
        setBlockedSlots(filtered)
      })
      .catch(() => setBlockedSlots([]))
      .finally(() => setLoadingBlockedSlots(false))
  }

  useEffect(() => {
    loadBlockedSlots()
  }, [])

  const handleLookupAppointment = async () => {
    const phone = phoneInput.trim()
    if (!phone) return
    setLookupError(null)
    setSearchedAppointments([])
    setLookupLoading(true)
    try {
      const list = await getAppointmentsByPhone(phone)
      setSearchedAppointments(list)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'No hay reservas próximas para ese teléfono'
      setLookupError(msg)
    } finally {
      setLookupLoading(false)
    }
  }

  const handleSaveService = async (s: ServiceListItem) => {
    const priceStr = editingPrice[s.id] ?? String(s.price)
    const durationStr = editingDuration[s.id] ?? String(s.duration)
    const price = parseFloat(priceStr)
    const duration = parseInt(durationStr, 10)
    if (Number.isNaN(price) || price <= 0) return
    if (Number.isNaN(duration) || duration < 15 || duration > 120) return
    const payload: {
      price: number
      duration: number
      name?: string
      shortDescription?: string | null
      description?: string | null
    } = { price, duration }
    if (editingServiceName[s.id] && editingServiceName[s.id].trim()) {
      payload.name = editingServiceName[s.id].trim()
    }
    if (editingServiceShortDesc[s.id] !== undefined) {
      const v = editingServiceShortDesc[s.id].trim()
      payload.shortDescription = v ? v : null
    }
    if (editingServiceDesc[s.id] !== undefined) {
      const v = editingServiceDesc[s.id].trim()
      payload.description = v ? v : null
    }
    setSavingId(s.id)
    setJustSavedId(null)
    try {
      const updated = await updateService(s.id, payload)
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
      setEditingServiceName((prev) => {
        const next = { ...prev }
        delete next[s.id]
        return next
      })
      setEditingServiceShortDesc((prev) => {
        const next = { ...prev }
        delete next[s.id]
        return next
      })
      setEditingServiceDesc((prev) => {
        const next = { ...prev }
        delete next[s.id]
        return next
      })
      setJustSavedId(s.id)
    } catch (err) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al guardar')
    } finally {
      setSavingId(null)
    }
  }

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newService.name.trim() || !newService.price || !newService.duration) return
    setCreatingService(true)
    try {
      const service = await createService({
        name: newService.name.trim(),
        price: Number(newService.price),
        duration: Math.min(120, Math.max(15, Number(newService.duration))),
        isActive: newService.isActive,
      })
      setServices((prev) => [...prev, service])
      setNewService({ name: '', price: '', duration: '30', isActive: true })
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Error al crear servicio'
      )
    } finally {
      setCreatingService(false)
    }
  }

  const handleToggleServiceActive = async (s: ServiceListItem) => {
    setSavingId(s.id)
    setJustSavedId(null)
    try {
      const updated = await updateService(s.id, { isActive: !s.isActive })
      setServices((prev) => prev.map((x) => (x.id === s.id ? updated : x)))
      setJustSavedId(s.id)
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Error al actualizar servicio'
      )
    } finally {
      setSavingId(null)
    }
  }

  const handleDeleteService = async (serviceId: string) => {
    if (!window.confirm('¿Eliminar este servicio?')) return
    try {
      await deleteService(serviceId)
      setServices((prev) => prev.filter((s) => s.id !== serviceId))
      setSubServicesByService((prev) => {
        const next = { ...prev }
        delete next[serviceId]
        return next
      })
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Error al eliminar servicio'
      )
    }
  }

  const handleAddSubService = async (e: React.FormEvent, serviceId: string) => {
    e.preventDefault()
    const current = newSubService[serviceId] ?? { name: '', price: '', duration: '30' }
    if (!current.name.trim() || !current.price || !current.duration) return
    setCreatingService(true)
    try {
      const created = await createAdminSubService(serviceId, {
        name: current.name.trim(),
        price: Number(current.price),
        duration: Math.min(120, Math.max(15, Number(current.duration))),
        isActive: true,
      })
      setSubServicesByService((prev) => ({
        ...prev,
        [serviceId]: [...(prev[serviceId] ?? []), created],
      }))
      setNewSubService((prev) => ({
        ...prev,
        [serviceId]: { name: '', price: '', duration: '30' },
      }))
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Error al crear subservicio'
      )
    } finally {
      setCreatingService(false)
    }
  }

  const handleDeleteSubService = async (subServiceId: string, serviceId: string) => {
    if (!window.confirm('¿Eliminar este subservicio?')) return
    try {
      await deleteAdminSubService(subServiceId)
      setSubServicesByService((prev) => ({
        ...prev,
        [serviceId]: (prev[serviceId] ?? []).filter((s) => s.id !== subServiceId),
      }))
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Error al eliminar subservicio'
      )
    }
  }

  useEffect(() => {
    if (!justSavedId) return
    const t = setTimeout(() => setJustSavedId(null), 2500)
    return () => clearTimeout(t)
  }, [justSavedId])

  const handleCancelAppointment = async () => {
    if (!cancelModal || !cancelReason.trim()) return
    setCancelling(true)
    try {
      await cancelAppointmentByOwner(cancelModal.id, cancelReason.trim())
      setSearchedAppointments((prev) => prev.filter((a) => a.id !== cancelModal.id))
      setCancelModal(null)
      setCancelReason('')
    } catch (err) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al cancelar')
    } finally {
      setCancelling(false)
    }
  }

  const handleCreateBlock = async () => {
    if (!blockDate.trim()) return
    if (blockType === 'TIME_SLOT' && (!blockStartTime.trim() || !blockEndTime.trim())) return
    setBlockSubmitting(true)
    try {
      const body: Parameters<typeof createBlockedSlot>[0] = {
        date: blockDate,
        type: blockType,
        reason: blockReason.trim() || undefined,
      }
      if (blockType === 'TIME_SLOT') {
        body.startTime = blockStartTime
        body.endTime = blockEndTime
      }
      if (actsAsOwner) {
        body.scope = blockScope
      }
      await createBlockedSlot(body)
      setBlockDate('')
      setBlockType('FULL_DAY')
      setBlockStartTime('')
      setBlockEndTime('')
      setBlockReason('')
      loadBlockedSlots()
    } catch (err) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al crear el bloqueo')
    } finally {
      setBlockSubmitting(false)
    }
  }

  const handleWorkingHoursChange = (
    dayOfWeek: number,
    field: keyof WorkingHoursItem,
    value: string | boolean | null
  ) => {
    setWorkingHours((prev) =>
      prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h))
    )
  }

  const handleDeleteBlock = async (id: string) => {
    setDeletingBlockId(id)
    try {
      await deleteBlockedSlot(id)
      setBlockedSlots((prev) => prev.filter((b) => b.id !== id))
    } catch (err) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al eliminar el bloqueo')
    } finally {
      setDeletingBlockId(null)
    }
  }

  if (!businessTitle) {
    return (
      <main className="flex min-h-[40vh] items-center justify-center p-8">
        <p className="text-neutral-500">Cargando panel...</p>
      </main>
    )
  }

  return (
    <main className="p-4 pb-10 sm:p-6 lg:p-8">
      {/* Título principal: nombre del negocio + Configuración; derecha: volver a página principal */}
      <header className="mb-6 flex flex-col gap-3 border-b border-neutral-200 pb-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:pb-6">
        <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">
          {businessTitle}
        </h1>
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-neutral-600 underline decoration-neutral-300 underline-offset-2 transition-colors hover:text-neutral-900 hover:decoration-neutral-500"
        >
          <span aria-hidden>←</span>
          Ir a la página principal
        </Link>
      </header>

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

      {/* Modals */}
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
                    defaultValue={svc.shortDescription ?? ''}
                    onChange={(e) =>
                      setEditingServiceShortDesc((prev) => ({ ...prev, [svc.id]: e.target.value }))
                    }
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-700">
                    Descripción extendida
                  </label>
                  <textarea
                    rows={4}
                    defaultValue={svc.description ?? ''}
                    onChange={(e) =>
                      setEditingServiceDesc((prev) => ({ ...prev, [svc.id]: e.target.value }))
                    }
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const shortV = (editingServiceShortDesc[svc.id] ?? svc.shortDescription ?? '').trim()
                      const longV = (editingServiceDesc[svc.id] ?? svc.description ?? '').trim()
                      const updated = await updateService(svc.id, {
                        shortDescription: shortV ? shortV : null,
                        description: longV ? longV : null,
                      })
                      setServices((prev) => prev.map((x) => (x.id === svc.id ? updated : x)))
                      setServiceDescriptionsModalId(null)
                    } catch (err) {
                      setError(
                        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
                          'Error al guardar descripciones'
                      )
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

      <ImagesModal
        open={!!serviceImagesModalId}
        title={`Imágenes · ${services.find((x) => x.id === serviceImagesModalId)?.name ?? ''}`}
        subtitle="Máximo 5 imágenes. Se optimizan automáticamente al subirlas."
        initialImages={services.find((x) => x.id === serviceImagesModalId)?.images ?? []}
        onClose={() => setServiceImagesModalId(null)}
        uploadFile={async (file) => {
          const { url } = await uploadAdminFile(file)
          return url
        }}
        onSave={async (images) => {
          const svcId = serviceImagesModalId
          if (!svcId) return
          try {
            const updated = await updateService(svcId, { images })
            setServices((prev) => prev.map((x) => (x.id === svcId ? updated : x)))
            setServiceImagesModalId(null)
          } catch (err) {
            setError(
              (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
                'Error al guardar imágenes'
            )
          }
        }}
      />

      <ImagesModal
        open={!!subServiceImagesModal}
        title={`Imágenes · ${
          (() => {
            if (!subServiceImagesModal) return ''
            const list = subServicesByService[subServiceImagesModal.serviceId] ?? []
            return list.find((x) => x.id === subServiceImagesModal.subServiceId)?.name ?? ''
          })()
        }`}
        subtitle="Máximo 5 imágenes. Se optimizan automáticamente al subirlas."
        initialImages={
          (() => {
            if (!subServiceImagesModal) return []
            const list = subServicesByService[subServiceImagesModal.serviceId] ?? []
            return list.find((x) => x.id === subServiceImagesModal.subServiceId)?.images ?? []
          })()
        }
        onClose={() => setSubServiceImagesModal(null)}
        uploadFile={async (file) => {
          const { url } = await uploadAdminFile(file)
          return url
        }}
        onSave={async (images) => {
          const modal = subServiceImagesModal
          if (!modal) return
          try {
            const updated = await updateAdminSubService(modal.subServiceId, { images })
            setSubServicesByService((prev) => ({
              ...prev,
              [modal.serviceId]: (prev[modal.serviceId] ?? []).map((x) =>
                x.id === modal.subServiceId ? updated : x
              ),
            }))
            setSubServiceImagesModal(null)
          } catch (err) {
            setError(
              (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
                'Error al guardar imágenes del subservicio'
            )
          }
        }}
      />

      {subServicesModalId && (() => {
        const svc = services.find((x) => x.id === subServicesModalId) ?? null
        if (!svc) return null
        const subs = subServicesByService[svc.id] ?? []
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-5xl rounded-xl bg-white p-5 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900">
                    Subservicios · {svc.name}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    Variantes con distinto precio/duración y descripciones.
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
                              ...(prev[svc.id] ?? { name: '', price: '', duration: '30' }),
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
                              ...(prev[svc.id] ?? { name: '', price: '', duration: '30' }),
                              price: e.target.value,
                            },
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
                        value={newSubService[svc.id]?.duration ?? '30'}
                        onChange={(e) =>
                          setNewSubService((prev) => ({
                            ...prev,
                            [svc.id]: {
                              ...(prev[svc.id] ?? { name: '', price: '', duration: '30' }),
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
                </form>
              </div>

              <div className="mt-4 max-h-[55vh] overflow-auto pr-1">
                {subs.length === 0 ? (
                  <p className="text-sm text-neutral-500">Todavía no hay subservicios.</p>
                ) : (
                  <div className="space-y-2">
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
                          <div className="flex flex-col items-end justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setSubServiceImagesModal({ serviceId: svc.id, subServiceId: sub.id })
                              }
                              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                            >
                              Imágenes
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const changes = editingSubService[sub.id] ?? {}
                                  const body: any = {}
                                  if (changes.name !== undefined) body.name = changes.name.trim()
                                  if (changes.price !== undefined) body.price = Number(changes.price)
                                  if (changes.duration !== undefined) body.duration = Number(changes.duration)
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
                                    [svc.id]: (prev[svc.id] ?? []).map((x) => (x.id === sub.id ? updated : x)),
                                  }))
                                  setEditingSubService((prev) => {
                                    const next = { ...prev }
                                    delete next[sub.id]
                                    return next
                                  })
                                } catch (err) {
                                  setError(
                                    (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
                                      'Error al guardar subservicio'
                                  )
                                }
                              }}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSubService(sub.id, svc.id)}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-neutral-700">
                              Descripción corta
                            </label>
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
                              placeholder="Texto breve que se ve siempre"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-neutral-700">
                              Descripción extendida
                            </label>
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
                              placeholder="Texto para “Leer más”"
                            />
                          </div>
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

      {actsAsOwner && (section === 'all' || section === 'services') && (
      <section className="mt-8 mb-10 sm:mt-10 sm:mb-12">
        <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">
          Servicios (precio, duración y estado)
        </h2>
        <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={showServiceConfirmModal}
              disabled={showServiceConfirmModalSaving}
              onChange={async (e) => {
                const next = e.target.checked
                setShowServiceConfirmModal(next)
                setShowServiceConfirmModalSaving(true)
                try {
                  await updateBusinessSettings({ showServiceConfirmModal: next })
                } catch (err) {
                  setShowServiceConfirmModal((prev) => !prev)
                  setError(
                    (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
                      'Error al guardar la configuración'
                  )
                } finally {
                  setShowServiceConfirmModalSaving(false)
                }
              }}
              className="mt-1 rounded border-neutral-300"
            />
            <span>
              <span className="block text-sm font-medium text-neutral-900">
                Pedir confirmación antes del calendario
              </span>
              <span className="mt-0.5 block text-xs text-neutral-600">
                Cuando el cliente confirme un servicio/subservicio, se mostrará un segundo modal para confirmar antes de pasar al calendario.
              </span>
            </span>
          </label>
        </div>
        {loadingServices ? (
          <p className="mt-2 text-sm text-neutral-500">Cargando servicios...</p>
        ) : services.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">
            No hay servicios. Podés crearlos desde aquí.
          </p>
        ) : (
          <>
            <form
              onSubmit={handleAddService}
              className="mt-4 mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
            >
              <div className="w-40">
                <label
                  htmlFor="newServiceNameDashboard"
                  className="mb-1 block text-xs text-neutral-600"
                >
                  Nombre *
                </label>
                <input
                  id="newServiceNameDashboard"
                  type="text"
                  required
                  value={newService.name}
                  onChange={(e) => setNewService((p) => ({ ...p, name: e.target.value }))}
                  placeholder="ej. Corte"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="w-24">
                <label
                  htmlFor="newServicePriceDashboard"
                  className="mb-1 block text-xs text-neutral-600"
                >
                  Precio *
                </label>
                <input
                  id="newServicePriceDashboard"
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
                <label
                  htmlFor="newServiceDurationDashboard"
                  className="mb-1 block text-xs text-neutral-600"
                >
                  Duración (min) *
                </label>
                <input
                  id="newServiceDurationDashboard"
                  type="number"
                  required
                  min={15}
                  max={120}
                  value={newService.duration}
                  onChange={(e) =>
                    setNewService((p) => ({ ...p, duration: e.target.value }))
                  }
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newService.isActive}
                  onChange={(e) =>
                    setNewService((p) => ({ ...p, isActive: e.target.checked }))
                  }
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
            </form>

            {/* Mobile: una card por servicio y sus subservicios */}
            <div className="mt-4 space-y-4 md:hidden">
              {services.map((s) => (
                <div
                  key={s.id}
                  className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-3">
                    <label className="mb-1 block text-xs font-medium text-neutral-500">
                      Nombre del servicio
                    </label>
                    <input
                      type="text"
                      defaultValue={s.name}
                      onChange={(e) =>
                        setEditingServiceName((prev) => ({ ...prev, [s.id]: e.target.value }))
                      }
                      className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-neutral-500">Precio ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                        defaultValue={s.price}
                        onChange={(e) =>
                          setEditingPrice((prev) => ({ ...prev, [s.id]: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-neutral-500">Duración (min)</label>
                      <input
                        type="number"
                        min="15"
                        max="120"
                        className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                        defaultValue={s.duration}
                        onChange={(e) =>
                          setEditingDuration((prev) => ({ ...prev, [s.id]: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setServiceDescriptionsModalId(s.id)}
                      className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      Descripciones
                    </button>
                    <button
                      type="button"
                      onClick={() => setServiceImagesModalId(s.id)}
                      className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      Imágenes
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubServicesModalId(s.id)}
                      className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      Subservicios
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleServiceActive(s)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                        s.isActive
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-neutral-300 bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {s.isActive ? 'Activo' : 'Inactivo'}
                    </button>
                    <button
                      type="button"
                      disabled={savingId === s.id}
                      onClick={() => handleSaveService(s)}
                      className={`inline-block rounded-lg border px-4 py-2 text-sm font-medium ${
                        justSavedId === s.id
                          ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                          : savingId === s.id
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 opacity-70'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:opacity-50'
                      }`}
                    >
                      {savingId === s.id
                        ? 'Guardando...'
                        : justSavedId === s.id
                          ? 'Guardado ✓'
                          : 'Guardar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteService(s.id)}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop: tabla + subservicios */}
            <div className="mt-4 hidden md:block md:overflow-x-auto md:rounded-lg md:border md:border-neutral-200">
              <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-neutral-700">Servicio</th>
                    <th className="px-4 py-3 font-medium text-neutral-700">Precio ($)</th>
                    <th className="px-4 py-3 font-medium text-neutral-700">Duración (min)</th>
                    <th className="px-4 py-3 font-medium text-neutral-700">Estado</th>
                    <th className="px-4 py-3 font-medium text-neutral-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {services.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-3 font-medium text-neutral-900 align-top">
                        <div>
                          <input
                            type="text"
                            defaultValue={s.name}
                            onChange={(e) =>
                              setEditingServiceName((prev) => ({ ...prev, [s.id]: e.target.value }))
                            }
                            className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
                          />
                        </div>
                        {/* Subservices inline under the service name */}
                        <div className="mt-2 rounded bg-neutral-50 p-2">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setServiceDescriptionsModalId(s.id)}
                              className="rounded border border-neutral-300 bg-white px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-100"
                            >
                              Descripciones
                            </button>
                            <button
                              type="button"
                              onClick={() => setServiceImagesModalId(s.id)}
                              className="rounded border border-neutral-300 bg-white px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-100"
                            >
                              Imágenes
                            </button>
                            <button
                              type="button"
                              onClick={() => setSubServicesModalId(s.id)}
                              className="rounded border border-neutral-300 bg-white px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-100"
                            >
                              Subservicios
                            </button>
                          </div>
                        </div>
                      </td>
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
                          onClick={() => handleToggleServiceActive(s)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                            s.isActive
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                              : 'border-neutral-300 bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {s.isActive ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            disabled={savingId === s.id}
                            onClick={() => handleSaveService(s)}
                            className={`inline-block rounded-lg border px-3 py-1.5 text-sm font-medium ${
                              justSavedId === s.id
                                ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                                : savingId === s.id
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 opacity-70'
                                  : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:opacity-50'
                            }`}
                          >
                            {savingId === s.id
                              ? 'Guardando...'
                              : justSavedId === s.id
                                ? 'Guardado ✓'
                                : 'Guardar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteService(s.id)}
                            className="inline-block rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
      )}

      {actsAsOwner && (section === 'all' || section === 'hours') && (
      <section className="mt-8 mb-10 sm:mt-10 sm:mb-12">
        <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">Horarios de apertura</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Configurá horario de apertura y cierre por día. Opcional: pausa donde no se atiende (ej. almuerzo).
        </p>
        {workingHoursError && (
          <p className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{workingHoursError}</p>
        )}
        {workingHoursJustSaved && !workingHoursError && (
          <p className="mt-3 rounded-md bg-emerald-50 p-2 text-sm text-emerald-700">
            Horarios guardados correctamente.
          </p>
        )}
        {loadingWorkingHours ? (
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
                  <th className="py-2">Corte inicio</th>
                  <th className="py-2">Corte fin</th>
                </tr>
              </thead>
              <tbody>
                {workingHours.map((h) => (
                  <tr key={h.dayOfWeek} className="border-b border-neutral-100">
                    <td className="py-2 font-medium">
                      {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][h.dayOfWeek]}
                    </td>
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
                          handleWorkingHoursChange(
                            h.dayOfWeek,
                            'lunchStart',
                            e.target.value || null
                          )
                        }
                        disabled={h.isClosed}
                        placeholder="--:--"
                        className="w-28 rounded border border-neutral-300 px-2 py-1 disabled:bg-neutral-100"
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="time"
                        value={h.lunchEnd ?? ''}
                        onChange={(e) =>
                          handleWorkingHoursChange(
                            h.dayOfWeek,
                            'lunchEnd',
                            e.target.value || null
                          )
                        }
                        disabled={h.isClosed}
                        placeholder="--:--"
                        className="w-28 rounded border border-neutral-300 px-2 py-1 disabled:bg-neutral-100"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-neutral-500">
            Todavía no configuraste horarios. Completá al menos un día para que se ofrezcan turnos en la página de reservas.
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={loadingWorkingHours || savingWorkingHours}
            onClick={async () => {
              setWorkingHoursError(null)
              setWorkingHoursJustSaved(false)
              setSavingWorkingHours(true)
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
                const updated = await updateWorkingHours(payload)
                setWorkingHours(updated)
                setWorkingHoursJustSaved(true)
                setTimeout(() => setWorkingHoursJustSaved(false), 2500)
              } catch (err) {
                const msg =
                  (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
                  'Error al guardar horarios'
                setWorkingHoursError(msg)
              } finally {
                setSavingWorkingHours(false)
              }
            }}
            className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {savingWorkingHours ? 'Guardando...' : 'Guardar horarios'}
          </button>
        </div>
      </section>
      )}

      {(section === 'all' || section === 'blocking') && (
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
                <span className="mb-1 block text-xs font-medium text-neutral-600">
                  Aplicar a
                </span>
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
              onClick={handleCreateBlock}
              className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-50"
            >
              {blockSubmitting ? 'Bloqueando...' : 'Bloquear'}
            </button>
          </div>
        </div>
        <div className="mt-4">
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
      </section>
      )}

      {(section === 'all' || section === 'cancel') && (
      <section className="mt-8 sm:mt-10">
        <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">Cancelar turno</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Ingresá el teléfono del cliente para ver sus reservas y cancelar. El motivo es obligatorio. Al cancelar se elimina de Google Calendar.
          {userRole === 'STAFF' && (
            <span className="mt-1 block text-neutral-500">
              Solo ves y podés cancelar los turnos asignados a vos.
            </span>
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
              if (!v.trim()) {
                setSearchedAppointments([])
                setLookupError(null)
              }
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleLookupAppointment()}
            placeholder="Ingresar teléfono del cliente"
            className="min-w-0 flex-1 rounded border border-neutral-300 px-3 py-2.5 text-sm sm:min-w-[200px] sm:flex-none"
          />
          <button
            type="button"
            disabled={lookupLoading || !phoneInput.trim()}
            onClick={handleLookupAppointment}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 transition-all hover:scale-105 hover:bg-emerald-100 disabled:opacity-50 disabled:hover:scale-100"
          >
            {lookupLoading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        {lookupError && (
          <p className="mt-2 text-sm text-red-600">{lookupError}</p>
        )}
        {searchedAppointments.length > 0 && (() => {
          const grouped = groupAppointmentsByDate(searchedAppointments)
          return (
            <div className="mt-4 space-y-4">
              {grouped.map(([dateKey, list], groupIndex) => (
                <div key={dateKey}>
                  <p className="mb-2 text-sm font-medium text-neutral-700">
                    {formatDateShort(list[0].startTime)}
                  </p>
                  {list.map((a) => (
                    <div
                      key={a.id}
                      className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2 sm:py-2"
                    >
                      <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-1 text-neutral-700 sm:gap-x-3">
                        <span className="font-medium text-neutral-900">{formatDateTime(a.startTime)}</span>
                        <span aria-hidden className="text-neutral-400">·</span>
                        <span>{a.serviceName}</span>
                        <span aria-hidden className="text-neutral-400">·</span>
                        <span>{a.clientName}</span>
                        <span aria-hidden className="text-neutral-400">·</span>
                        <span>{a.clientPhone}</span>
                        <span aria-hidden className="text-neutral-400">·</span>
                        <span className="font-medium">${a.price}</span>
                      </div>
                      {a.status === 'UPCOMING' ? (
                        <button
                          type="button"
                          onClick={() => setCancelModal(a)}
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
      )}

      {/* Modal cancelar */}
      {cancelModal && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-neutral-900">Cancelar reserva</h3>
            <p className="mt-1 text-sm text-neutral-600">
              Reserva de <strong>{cancelModal.clientName}</strong> ({cancelModal.serviceName}). El motivo es obligatorio. Se eliminará de Google Calendar.
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
