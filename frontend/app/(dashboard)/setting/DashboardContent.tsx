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
  getOwnerEmployees,
  getOwnerCalendarColor,
  createOwnerEmployee,
  updateOwnerEmployee,
  updateOwnerCalendarColor,
  deleteOwnerEmployee,
} from '@/lib/api'
import { ImagesModal } from '@/components/ImagesModal'
import { ServiceDescriptionsModal } from './components/modals/ServiceDescriptionsModal'
import { SubServicesModal } from './components/modals/SubServicesModal'
import { CancelAppointmentModal } from './components/modals/CancelAppointmentModal'
import { ServicesSection } from './components/sections/ServicesSection'
import { ServiceAddOnsSection } from '@/components/ServiceAddOnsSection'
import { HoursSection } from './components/sections/HoursSection'
import { BlockingSection } from './components/sections/BlockingSection'
import { CancelSection } from './components/sections/CancelSection'
import { EmployeesSection } from './components/sections/EmployeesSection'
import { PublicBrandingSection } from './components/PublicBrandingSection'
import { PublicDefaultThemeSection } from './components/PublicDefaultThemeSection'
import {
  DEFAULT_PUBLIC_PAGE_BG_DARK,
  DEFAULT_PUBLIC_PAGE_BG_LIGHT,
} from '@/lib/publicPageBackground'
import type {
  ServiceListItem,
  AppointmentListItem,
  BlockedSlotListItem,
  WorkingHoursItem,
  SubServiceAdminItem,
  OwnerEmployeeListItem,
} from '@/types'

const GOOGLE_CALENDAR_URL = 'https://calendar.google.com'

type DashboardSection = 'all' | 'services' | 'payments' | 'blocking' | 'hours' | 'employees' | 'cancel'
type PaymentMode = 'REQUIRED' | 'OPTIONAL' | 'CONFIRM_ONLY'
type FontFamilyKey = 'ROBOTO' | 'MONTSERRAT' | 'INTER' | 'POPPINS' | 'NUNITO' | 'PLAYFAIR'
type IndustryCapabilities = {
  allowSubServices: boolean
  allowBrandingAdvanced: boolean
  allowServiceAddOns: boolean
}

const FONT_OPTIONS: { key: FontFamilyKey; label: string; cssVar: string; sample: string }[] = [
  { key: 'ROBOTO', label: 'Roboto', cssVar: 'var(--font-roboto)', sample: 'Aa Bb Cc' },
  { key: 'MONTSERRAT', label: 'Montserrat', cssVar: 'var(--font-montserrat)', sample: 'Aa Bb Cc' },
  { key: 'INTER', label: 'Inter', cssVar: 'var(--font-inter)', sample: 'Aa Bb Cc' },
  { key: 'POPPINS', label: 'Poppins', cssVar: 'var(--font-poppins)', sample: 'Aa Bb Cc' },
  { key: 'NUNITO', label: 'Nunito', cssVar: 'var(--font-nunito)', sample: 'Aa Bb Cc' },
  { key: 'PLAYFAIR', label: 'Playfair', cssVar: 'var(--font-playfair)', sample: 'Aa Bb Cc' },
]

export function DashboardContent({ section = 'all' }: { section?: DashboardSection }) {
  const [businessTitle, setBusinessTitle] = useState<string | null>(null)
  const [businessSlug, setBusinessSlug] = useState<string | null>(null)
  const [capabilities, setCapabilities] = useState<IndustryCapabilities | null>(null)
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
  const [allowMultipleServices, setAllowMultipleServices] = useState(false)
  const [allowMultipleServicesSaving, setAllowMultipleServicesSaving] = useState(false)
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
  const [fontFamily, setFontFamily] = useState<FontFamilyKey>('ROBOTO')
  const [bgDarkHex, setBgDarkHex] = useState(DEFAULT_PUBLIC_PAGE_BG_DARK)
  const [bgLightHex, setBgLightHex] = useState(DEFAULT_PUBLIC_PAGE_BG_LIGHT)
  const [publicBrandColor, setPublicBrandColor] = useState<string | null>(null)
  const [publicBrandIntensity, setPublicBrandIntensity] = useState<'SOFT' | 'NORMAL' | 'STRONG'>('SOFT')
  const [publicUseGradient, setPublicUseGradient] = useState(false)
  const [publicDefaultTheme, setPublicDefaultTheme] = useState<'LIGHT' | 'DARK'>('DARK')
  const [savingFont, setSavingFont] = useState(false)
  const [fontJustSaved, setFontJustSaved] = useState(false)
  const [restoringAppearanceDefaults, setRestoringAppearanceDefaults] = useState(false)
  const [appearanceJustRestored, setAppearanceJustRestored] = useState(false)

  const [employees, setEmployees] = useState<OwnerEmployeeListItem[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [creatingEmployee, setCreatingEmployee] = useState(false)
  const [savingEmployeeId, setSavingEmployeeId] = useState<string | null>(null)
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null)
  const [ownerCalendarColorId, setOwnerCalendarColorId] = useState('')
  const [savingOwnerCalendarColor, setSavingOwnerCalendarColor] = useState(false)
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    photoUrl: '',
    staffEmail: '',
    staffPassword: '',
    ownerCalendarColorId: '',
  })
  const [editingEmployee, setEditingEmployee] = useState<
    Record<
      string,
      Partial<{
        name: string
        photoUrl: string
        staffEmail: string
        staffPassword: string
        ownerCalendarColorId: string
      }>
    >
  >({})

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
        setCapabilities((b as any).capabilities ?? null)
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
        if (capabilities && capabilities.allowSubServices === false) {
          setSubServicesByService({})
          return
        }
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
  }, [userRole, actsAsOwner, capabilities])

  useEffect(() => {
    if (!actsAsOwner) return
    getBusinessSettings()
      .then((s) => {
        setShowServiceConfirmModal(!!s.showServiceConfirmModal)
        setAllowMultipleServices(!!(s as { allowMultipleServices?: boolean }).allowMultipleServices)
        const nextFont = String((s as any).fontFamily ?? 'ROBOTO').toUpperCase()
        if (FONT_OPTIONS.some((x) => x.key === nextFont)) {
          setFontFamily(nextFont as FontFamilyKey)
        } else {
          setFontFamily('ROBOTO')
        }
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
        setBgDarkHex(s.publicPageBackgroundDark ?? DEFAULT_PUBLIC_PAGE_BG_DARK)
        setBgLightHex(s.publicPageBackgroundLight ?? DEFAULT_PUBLIC_PAGE_BG_LIGHT)
        setPublicBrandColor(s.publicBrandColor ?? null)
        const rawIntensity = String(s.publicBrandIntensity ?? 'SOFT').toUpperCase()
        setPublicBrandIntensity(rawIntensity === 'STRONG' ? 'STRONG' : rawIntensity === 'NORMAL' ? 'NORMAL' : 'SOFT')
        setPublicUseGradient(!!s.publicUseGradient)
        const th = String(s.theme ?? 'DARK').toUpperCase()
        setPublicDefaultTheme(th === 'LIGHT' ? 'LIGHT' : 'DARK')
      })
      .catch(() => {
        setShowServiceConfirmModal(false)
        setAllowMultipleServices(false)
        setFontFamily('ROBOTO')
        setBgDarkHex(DEFAULT_PUBLIC_PAGE_BG_DARK)
        setBgLightHex(DEFAULT_PUBLIC_PAGE_BG_LIGHT)
        setPublicBrandColor(null)
        setPublicBrandIntensity('SOFT')
        setPublicUseGradient(false)
        setPublicDefaultTheme('DARK')
        setPaymentMode('CONFIRM_ONLY')
        setPaymentRequired(false)
        setPaymentOptionalEnabled(false)
      })
  }, [actsAsOwner])

  useEffect(() => {
    if (!fontJustSaved) return
    const t = setTimeout(() => setFontJustSaved(false), 2500)
    return () => clearTimeout(t)
  }, [fontJustSaved])

  useEffect(() => {
    if (!appearanceJustRestored) return
    const t = setTimeout(() => setAppearanceJustRestored(false), 2500)
    return () => clearTimeout(t)
  }, [appearanceJustRestored])

  const handleRestoreAppearanceDefaults = async () => {
    setRestoringAppearanceDefaults(true)
    setAppearanceJustRestored(false)
    try {
      const updated = await updateBusinessSettings({
        publicBrandColor: null,
        publicBrandIntensity: 'SOFT',
        publicUseGradient: false,
        publicPageBackgroundDark: null,
        publicPageBackgroundLight: null,
      })
      setBgDarkHex(updated.publicPageBackgroundDark ?? DEFAULT_PUBLIC_PAGE_BG_DARK)
      setBgLightHex(updated.publicPageBackgroundLight ?? DEFAULT_PUBLIC_PAGE_BG_LIGHT)
      setPublicBrandColor(updated.publicBrandColor ?? null)
      setPublicBrandIntensity(updated.publicBrandIntensity ?? 'SOFT')
      setPublicUseGradient(!!updated.publicUseGradient)
      setAppearanceJustRestored(true)
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Error al restaurar la apariencia'
      )
    } finally {
      setRestoringAppearanceDefaults(false)
    }
  }

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

  useEffect(() => {
    if (!actsAsOwner) return
    if (!(section === 'all' || section === 'employees')) return
    setLoadingEmployees(true)
    Promise.all([getOwnerEmployees(), getOwnerCalendarColor()])
      .then(([list, ownerColor]) => {
        setEmployees(list)
        setOwnerCalendarColorId(ownerColor.ownerCalendarColorId ?? '')
      })
      .catch((err) => {
        setEmployees([])
        setError(err?.response?.data?.error || 'Error al cargar empleados')
      })
      .finally(() => setLoadingEmployees(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actsAsOwner, section])


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

  const handleCreateEmployee = async () => {
    const name = newEmployee.name.trim()
    const staffEmail = newEmployee.staffEmail.trim()
    const staffPassword = newEmployee.staffPassword.trim()
    if (!name || !staffEmail || staffPassword.length < 6) return
    setCreatingEmployee(true)
    try {
      const created = await createOwnerEmployee({
        name,
        photoUrl: newEmployee.photoUrl.trim() || null,
        staffEmail,
        staffPassword,
        ownerCalendarColorId: newEmployee.ownerCalendarColorId || null,
      })
      setEmployees((prev) => [...prev, created])
      setNewEmployee({
        name: '',
        photoUrl: '',
        staffEmail: '',
        staffPassword: '',
        ownerCalendarColorId: '',
      })
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al crear empleado')
    } finally {
      setCreatingEmployee(false)
    }
  }

  const handleSaveEmployee = async (emp: OwnerEmployeeListItem) => {
    const changes = editingEmployee[emp.id] ?? {}
    const payload: any = {}
    if (changes.name !== undefined) payload.name = changes.name.trim()
    if (changes.photoUrl !== undefined) payload.photoUrl = changes.photoUrl.trim() || null
    if (changes.staffEmail !== undefined) payload.staffEmail = changes.staffEmail.trim()
    if (changes.staffPassword !== undefined) payload.staffPassword = changes.staffPassword
    if (changes.ownerCalendarColorId !== undefined) {
      payload.ownerCalendarColorId = changes.ownerCalendarColorId || null
    }
    if (Object.keys(payload).length === 0) return

    setSavingEmployeeId(emp.id)
    try {
      const updated = await updateOwnerEmployee(emp.id, payload)
      setEmployees((prev) => prev.map((x) => (x.id === emp.id ? updated : x)))
      setEditingEmployee((prev) => {
        const next = { ...prev }
        delete next[emp.id]
        return next
      })
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al guardar empleado')
    } finally {
      setSavingEmployeeId(null)
    }
  }

  const handleDeleteEmployee = async (emp: OwnerEmployeeListItem) => {
    if (!window.confirm(`¿Eliminar a ${emp.name}?`)) return
    setDeletingEmployeeId(emp.id)
    try {
      await deleteOwnerEmployee(emp.id)
      setEmployees((prev) => prev.filter((x) => x.id !== emp.id))
      setEditingEmployee((prev) => {
        const next = { ...prev }
        delete next[emp.id]
        return next
      })
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al eliminar empleado')
    } finally {
      setDeletingEmployeeId(null)
    }
  }

  const handleSaveOwnerCalendarColor = async () => {
    setSavingOwnerCalendarColor(true)
    try {
      const updated = await updateOwnerCalendarColor({
        ownerCalendarColorId: ownerCalendarColorId || null,
      })
      setOwnerCalendarColorId(updated.ownerCalendarColorId ?? '')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al guardar color del dueño')
    } finally {
      setSavingOwnerCalendarColor(false)
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

  const handleSaveAppearance = async () => {
    setSavingFont(true)
    setFontJustSaved(false)
    try {
      const allowAdvanced = capabilities?.allowBrandingAdvanced !== false
      const updated = await updateBusinessSettings({
        fontFamily,
        theme: publicDefaultTheme,
        ...(allowAdvanced && {
          publicBrandColor,
          publicBrandIntensity,
          publicUseGradient,
          publicPageBackgroundDark: bgDarkHex === DEFAULT_PUBLIC_PAGE_BG_DARK ? null : bgDarkHex,
          publicPageBackgroundLight: bgLightHex === DEFAULT_PUBLIC_PAGE_BG_LIGHT ? null : bgLightHex,
        }),
      })
      const next = String((updated as any).fontFamily ?? fontFamily).toUpperCase()
      if (FONT_OPTIONS.some((x) => x.key === next)) {
        setFontFamily(next as FontFamilyKey)
      }
      setPublicDefaultTheme(updated.theme === 'LIGHT' ? 'LIGHT' : 'DARK')
      setBgDarkHex(updated.publicPageBackgroundDark ?? DEFAULT_PUBLIC_PAGE_BG_DARK)
      setBgLightHex(updated.publicPageBackgroundLight ?? DEFAULT_PUBLIC_PAGE_BG_LIGHT)
      setPublicBrandColor(updated.publicBrandColor ?? null)
      setPublicBrandIntensity(updated.publicBrandIntensity ?? 'SOFT')
      setPublicUseGradient(!!updated.publicUseGradient)
      setFontJustSaved(true)
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Error al guardar la apariencia'
      )
    } finally {
      setSavingFont(false)
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

      {actsAsOwner && section === 'all' && (
        <section className="mb-8 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Fuentes y Colores</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Fuente y fondos de la página pública de reserva (servicios, calendario, datos, pago).
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FONT_OPTIONS.map((opt) => {
              const selected = fontFamily === opt.key
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setFontFamily(opt.key)}
                  className={`rounded-xl border p-4 text-left transition ${
                    selected
                      ? 'border-neutral-900 bg-neutral-50 shadow-sm'
                      : 'border-neutral-200 bg-white hover:border-neutral-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-neutral-900">{opt.label}</div>
                      <div
                        className="mt-2 text-xl text-neutral-900"
                        style={{ fontFamily: opt.cssVar }}
                        aria-label={`Preview ${opt.label}`}
                      >
                        {opt.sample}
                      </div>
                      <div
                        className="mt-1 text-sm text-neutral-700"
                        style={{ fontFamily: opt.cssVar }}
                      >
                        El veloz murciélago hindú
                      </div>
                    </div>
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        selected ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 bg-white'
                      }`}
                      aria-hidden
                    >
                      {selected ? '✓' : ''}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {capabilities?.allowBrandingAdvanced === false ? null : (
            <>
              <PublicBrandingSection
                brandColor={publicBrandColor}
                intensity={publicBrandIntensity}
                useGradient={publicUseGradient}
                legacyDarkHex={bgDarkHex}
                legacyLightHex={bgLightHex}
                onBrandColor={setPublicBrandColor}
                onIntensity={setPublicBrandIntensity}
                onUseGradient={setPublicUseGradient}
                onReset={() => {
                  setPublicBrandColor('#E24A8D')
                  setPublicBrandIntensity('SOFT')
                  setPublicUseGradient(true)
                }}
              />

              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleRestoreAppearanceDefaults}
                  disabled={restoringAppearanceDefaults}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-900 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:opacity-60"
                >
                  <span aria-hidden>
                    {restoringAppearanceDefaults ? '⏳' : appearanceJustRestored ? '✓' : '↺'}
                  </span>
                  {restoringAppearanceDefaults ? 'Restaurando...' : 'Restaurar colores por defecto'}
                </button>
                <p className="mt-2 text-xs text-neutral-500">
                  Vuelve al estilo original: sin color de marca/gradiente y con fondo oscuro {DEFAULT_PUBLIC_PAGE_BG_DARK} / claro {DEFAULT_PUBLIC_PAGE_BG_LIGHT}.
                </p>
              </div>
            </>
          )}

          <PublicDefaultThemeSection value={publicDefaultTheme} onChange={setPublicDefaultTheme} />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSaveAppearance}
              disabled={savingFont}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {savingFont ? 'Guardando...' : 'Guardar'}
            </button>
            {fontJustSaved && (
              <span className="text-sm font-medium text-green-700">Guardado</span>
            )}
          </div>
        </section>
      )}

      <ServicesSection
        visible={actsAsOwner && (section === 'all' || section === 'services')}
        subServicesEnabled={capabilities?.allowSubServices !== false}
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
        allowMultipleServices={allowMultipleServices}
        allowMultipleServicesSaving={allowMultipleServicesSaving}
        onToggleAllowMultipleServices={async (next) => {
          setAllowMultipleServices(next)
          setAllowMultipleServicesSaving(true)
          try {
            await updateBusinessSettings({ allowMultipleServices: next })
          } catch (err) {
            setAllowMultipleServices((prev) => !prev)
            setError(
              (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
                'Error al guardar la configuración'
            )
          } finally {
            setAllowMultipleServicesSaving(false)
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
        openSubServices={(id) => {
          if (capabilities?.allowSubServices === false) return
          setSubServicesModalId(id)
        }}
      />

      <ServiceAddOnsSection
        visible={
          actsAsOwner &&
          capabilities?.allowServiceAddOns === true &&
          (section === 'all' || section === 'services')
        }
        client={{ kind: 'owner' }}
        services={services}
        subServicesByService={subServicesByService}
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

      <EmployeesSection
        visible={actsAsOwner && (section === 'all' || section === 'employees')}
        loading={loadingEmployees}
        employees={employees}
        ownerCalendarColorId={ownerCalendarColorId}
        setOwnerCalendarColorId={setOwnerCalendarColorId}
        savingOwnerColor={savingOwnerCalendarColor}
        onSaveOwnerColor={handleSaveOwnerCalendarColor}
        creating={creatingEmployee}
        savingId={savingEmployeeId}
        deletingId={deletingEmployeeId}
        newEmployee={newEmployee}
        setNewEmployee={setNewEmployee}
        editing={editingEmployee}
        setEditing={setEditingEmployee}
        onCreate={handleCreateEmployee}
        onSave={handleSaveEmployee}
        onDelete={handleDeleteEmployee}
        onUploadPhoto={async (file) => {
          const { url } = await uploadAdminFile(file)
          return url
        }}
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
