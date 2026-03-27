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
  getSubServices,
  createSubService,
  updateSubService,
  deleteSubService,
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
import { ServiceDescriptionsModal } from './components/modals/ServiceDescriptionsModal'
import { SubServicesModal } from './components/modals/SubServicesModal'
import { CancelAppointmentModal } from './components/modals/CancelAppointmentModal'
import { ServicesSection } from './components/sections/ServicesSection'
import { HoursSection } from './components/sections/HoursSection'
import { BlockingSection } from './components/sections/BlockingSection'
import { CancelSection } from './components/sections/CancelSection'
import type {
  ServiceListItem,
  AppointmentListItem,
  BlockedSlotListItem,
  WorkingHoursItem,
  SubServiceAdminItem,
} from '@/types'

const GOOGLE_CALENDAR_URL = 'https://calendar.google.com'

type DashboardSection = 'all' | 'services' | 'payments' | 'blocking' | 'hours' | 'cancel'
type PaymentMode = 'REQUIRED' | 'OPTIONAL' | 'CONFIRM_ONLY'

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
  const [mobileSubServiceOpenId, setMobileSubServiceOpenId] = useState<string | null>(null)
  const [mobileAddSubOpen, setMobileAddSubOpen] = useState(false)
  const [subServiceImagesModal, setSubServiceImagesModal] = useState<{
    serviceId: string
    subServiceId: string
  } | null>(null)
  const [showServiceConfirmModal, setShowServiceConfirmModal] = useState(false)
  const [showServiceConfirmModalSaving, setShowServiceConfirmModalSaving] = useState(false)
  const [paymentRequired, setPaymentRequired] = useState(false)
  const [paymentOptionalEnabled, setPaymentOptionalEnabled] = useState(false)
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CONFIRM_ONLY')
  const [paymentType, setPaymentType] = useState<'FULL' | 'PERCENTAGE'>('FULL')
  const [depositPercentage, setDepositPercentage] = useState('30')
  const [mercadoPagoPublicKey, setMercadoPagoPublicKey] = useState('')
  const [mercadoPagoAccessToken, setMercadoPagoAccessToken] = useState('')
  const [mercadoPagoWebhookSecret, setMercadoPagoWebhookSecret] = useState('')
  const [hasMercadoPagoAccessToken, setHasMercadoPagoAccessToken] = useState(false)
  const [savingPaymentSettings, setSavingPaymentSettings] = useState(false)
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
              const subs = await getSubServices(s.id)
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
      .then((s) => {
        setShowServiceConfirmModal(!!s.showServiceConfirmModal)
        setPaymentRequired(!!s.paymentRequired)
        setPaymentOptionalEnabled(!!s.paymentOptionalEnabled)
        const mode: PaymentMode = s.paymentRequired
          ? 'REQUIRED'
          : s.paymentOptionalEnabled
            ? 'OPTIONAL'
            : 'CONFIRM_ONLY'
        setPaymentMode(mode)
        setPaymentType(s.paymentType === 'PERCENTAGE' ? 'PERCENTAGE' : 'FULL')
        setDepositPercentage(
          s.depositPercentage != null && Number.isFinite(s.depositPercentage)
            ? String(s.depositPercentage)
            : '30'
        )
        setMercadoPagoPublicKey(s.mercadoPagoPublicKey ?? '')
        setMercadoPagoWebhookSecret(s.mercadoPagoWebhookSecret ?? '')
        setHasMercadoPagoAccessToken(!!s.hasMercadoPagoAccessToken)
      })
      .catch(() => {
        setShowServiceConfirmModal(false)
        setPaymentMode('CONFIRM_ONLY')
        setPaymentRequired(false)
        setPaymentOptionalEnabled(false)
      })
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
      const created = await createSubService(serviceId, {
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
      await deleteSubService(subServiceId)
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

  const handleSavePaymentSettings = async () => {
    setSavingPaymentSettings(true)
    try {
      const parsedDeposit = Number(depositPercentage)
      const safeDeposit =
        Number.isFinite(parsedDeposit) && parsedDeposit > 0
          ? Math.min(100, Math.max(1, parsedDeposit))
          : null
      const nextPaymentRequired = paymentMode === 'REQUIRED'
      const nextPaymentOptional = paymentMode === 'OPTIONAL'

      const updated = await updateBusinessSettings({
        paymentRequired: nextPaymentRequired,
        paymentOptionalEnabled: nextPaymentOptional,
        paymentType: paymentType === 'PERCENTAGE' ? 'PERCENTAGE' : 'FULL',
        depositPercentage:
          nextPaymentRequired && paymentType === 'PERCENTAGE' ? safeDeposit : null,
        mercadoPagoPublicKey: mercadoPagoPublicKey.trim() || null,
        mercadoPagoAccessToken: mercadoPagoAccessToken.trim() || undefined,
        mercadoPagoWebhookSecret: mercadoPagoWebhookSecret.trim() || null,
      })
      setPaymentRequired(updated.paymentRequired)
      setPaymentOptionalEnabled(updated.paymentOptionalEnabled)
      setPaymentMode(
        updated.paymentRequired
          ? 'REQUIRED'
          : updated.paymentOptionalEnabled
            ? 'OPTIONAL'
            : 'CONFIRM_ONLY'
      )
      setPaymentType(updated.paymentType === 'PERCENTAGE' ? 'PERCENTAGE' : 'FULL')
      setDepositPercentage(
        updated.depositPercentage != null ? String(updated.depositPercentage) : '30'
      )
      setMercadoPagoPublicKey(updated.mercadoPagoPublicKey ?? '')
      setMercadoPagoWebhookSecret(updated.mercadoPagoWebhookSecret ?? '')
      setHasMercadoPagoAccessToken(updated.hasMercadoPagoAccessToken)
      setMercadoPagoAccessToken('')
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Error al guardar configuración de pagos'
      )
    } finally {
      setSavingPaymentSettings(false)
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
          <ServiceDescriptionsModal
            service={svc}
            onClose={() => setServiceDescriptionsModalId(null)}
            onChangeShort={(value) => setEditingServiceShortDesc((prev) => ({ ...prev, [svc.id]: value }))}
            onChangeLong={(value) => setEditingServiceDesc((prev) => ({ ...prev, [svc.id]: value }))}
            onSave={async () => {
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
          />
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
            const updated = await updateSubService(modal.subServiceId, { images })
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
          <SubServicesModal
            service={svc}
            subServices={subs}
            mobileSubServiceOpenId={mobileSubServiceOpenId}
            setMobileSubServiceOpenId={setMobileSubServiceOpenId}
            mobileAddSubOpen={mobileAddSubOpen}
            setMobileAddSubOpen={setMobileAddSubOpen}
            newSubService={newSubService}
            setNewSubService={setNewSubService}
            editingSubService={editingSubService}
            setEditingSubService={setEditingSubService}
            onClose={() => {
              setSubServicesModalId(null)
              setMobileSubServiceOpenId(null)
              setMobileAddSubOpen(false)
            }}
            onAddSubService={handleAddSubService}
            onDeleteSubService={handleDeleteSubService}
            onOpenImages={(serviceId, subServiceId) => setSubServiceImagesModal({ serviceId, subServiceId })}
            onSaveSubService={async (sub, serviceId) => {
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
                const updated = await updateSubService(sub.id, body)
                setSubServicesByService((prev) => ({
                  ...prev,
                  [serviceId]: (prev[serviceId] ?? []).map((x) => (x.id === sub.id ? updated : x)),
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
          />
        )
      })()}

      {actsAsOwner && (section === 'all' || section === 'payments') && (
        <section className="mb-8 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Pagos (Mercado Pago)</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Configura si el pago es obligatorio u opcional y las credenciales de tu cuenta.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <p className="mb-2 text-sm font-medium text-neutral-800">Modo de pago</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-neutral-800">
                  <input
                    type="radio"
                    name="paymentMode"
                    checked={paymentMode === 'REQUIRED'}
                    onChange={() => setPaymentMode('REQUIRED')}
                  />
                  Exigir pago antes de confirmar reserva
                </label>
                <label className="flex items-center gap-2 text-sm text-neutral-800">
                  <input
                    type="radio"
                    name="paymentMode"
                    checked={paymentMode === 'OPTIONAL'}
                    onChange={() => setPaymentMode('OPTIONAL')}
                  />
                  Permitir pago opcional al reservar
                </label>
                <label className="flex items-center gap-2 text-sm text-neutral-800">
                  <input
                    type="radio"
                    name="paymentMode"
                    checked={paymentMode === 'CONFIRM_ONLY'}
                    onChange={() => setPaymentMode('CONFIRM_ONLY')}
                  />
                  Solo confirmación, sin opción de pago
                </label>
              </div>
            </div>
            <label className="flex flex-col gap-1 text-sm text-neutral-800">
              Tipo de cobro
              <select
                className="rounded-lg border border-neutral-300 px-3 py-2"
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as 'FULL' | 'PERCENTAGE')}
                disabled={paymentMode !== 'REQUIRED'}
              >
                <option value="FULL">Total</option>
                <option value="PERCENTAGE">Seña (%)</option>
              </select>
            </label>
            {paymentMode === 'REQUIRED' && paymentType === 'PERCENTAGE' && (
              <label className="flex flex-col gap-1 text-sm text-neutral-800">
                Porcentaje de seña
                <input
                  type="number"
                  min={1}
                  max={100}
                  className="rounded-lg border border-neutral-300 px-3 py-2"
                  value={depositPercentage}
                  onChange={(e) => setDepositPercentage(e.target.value)}
                />
              </label>
            )}
            <label className="flex flex-col gap-1 text-sm text-neutral-800 md:col-span-2">
              Mercado Pago Public Key
              <input
                type="text"
                className="rounded-lg border border-neutral-300 px-3 py-2"
                value={mercadoPagoPublicKey}
                onChange={(e) => setMercadoPagoPublicKey(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-neutral-800 md:col-span-2">
              Mercado Pago Access Token {hasMercadoPagoAccessToken ? '(ya cargado)' : ''}
              <input
                type="password"
                className="rounded-lg border border-neutral-300 px-3 py-2"
                value={mercadoPagoAccessToken}
                onChange={(e) => setMercadoPagoAccessToken(e.target.value)}
                placeholder={hasMercadoPagoAccessToken ? 'Dejar vacío para mantener actual' : ''}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-neutral-800 md:col-span-2">
              Webhook Secret (opcional)
              <input
                type="text"
                className="rounded-lg border border-neutral-300 px-3 py-2"
                value={mercadoPagoWebhookSecret}
                onChange={(e) => setMercadoPagoWebhookSecret(e.target.value)}
              />
            </label>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={handleSavePaymentSettings}
              disabled={savingPaymentSettings}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {savingPaymentSettings ? 'Guardando...' : 'Guardar pagos'}
            </button>
          </div>
        </section>
      )}

      <ServicesSection
        visible={actsAsOwner && (section === 'all' || section === 'services')}
        showServiceConfirmModal={showServiceConfirmModal}
        showServiceConfirmModalSaving={showServiceConfirmModalSaving}
        onToggleShowConfirm={async (next) => {
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
        loadingServices={loadingServices}
        services={services}
        newService={newService}
        setNewService={setNewService}
        creatingService={creatingService}
        onAddService={handleAddService}
        onSaveService={handleSaveService}
        onToggleServiceActive={handleToggleServiceActive}
        onDeleteService={handleDeleteService}
        savingId={savingId}
        justSavedId={justSavedId}
        setEditingServiceName={setEditingServiceName}
        setEditingPrice={setEditingPrice}
        setEditingDuration={setEditingDuration}
        openDescriptions={(id) => setServiceDescriptionsModalId(id)}
        openImages={(id) => setServiceImagesModalId(id)}
        openSubServices={(id) => setSubServicesModalId(id)}
      />

      <HoursSection
        visible={actsAsOwner && (section === 'all' || section === 'hours')}
        workingHours={workingHours}
        loading={loadingWorkingHours}
        saving={savingWorkingHours}
        error={workingHoursError}
        justSaved={workingHoursJustSaved}
        onChange={handleWorkingHoursChange}
        onSave={async () => {
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
      />

      <BlockingSection
        visible={section === 'all' || section === 'blocking'}
        actsAsOwner={actsAsOwner}
        blockedSlots={blockedSlots}
        loading={loadingBlockedSlots}
        deletingId={deletingBlockId}
        onDelete={handleDeleteBlock}
        blockDate={blockDate}
        setBlockDate={setBlockDate}
        blockType={blockType}
        setBlockType={setBlockType}
        blockStartTime={blockStartTime}
        setBlockStartTime={setBlockStartTime}
        blockEndTime={blockEndTime}
        setBlockEndTime={setBlockEndTime}
        blockReason={blockReason}
        setBlockReason={setBlockReason}
        blockSubmitting={blockSubmitting}
        onCreate={handleCreateBlock}
        blockScope={blockScope}
        setBlockScope={setBlockScope}
      />

      <CancelSection
        visible={section === 'all' || section === 'cancel'}
        userRole={userRole}
        phoneInput={phoneInput}
        setPhoneInput={setPhoneInput}
        searchedAppointments={searchedAppointments}
        lookupLoading={lookupLoading}
        lookupError={lookupError}
        onLookup={handleLookupAppointment}
        onOpenCancel={setCancelModal}
        onClearResults={() => {
          setSearchedAppointments([])
          setLookupError(null)
        }}
      />

      {/* Modal cancelar */}
      {cancelModal && (
        <CancelAppointmentModal
          appointment={cancelModal}
          reason={cancelReason}
          cancelling={cancelling}
          onChangeReason={setCancelReason}
          onClose={() => {
            setCancelModal(null)
            setCancelReason('')
          }}
          onConfirm={handleCancelAppointment}
        />
      )}
    </main>
  )
}
