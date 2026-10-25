'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import {
  getAuthUser,
  removeAuthToken,
  setAuthToken,
  setAuthUser,
  setAdminActingShopSlug,
  clearAdminActingShopSlug,
} from '@/lib/auth'
import type { Business, ServiceOption, CreatedAppointment } from './types'
import { formatDateKey, getNowInArgentina, serviceOptionTotalPrice } from './utils'
import {
  BookingDone,
  BookingLayout,
  BookingSummary,
  BusinessHero,
  BusinessInfoBar,
  LoginModal,
  MonthCalendar,
  PaymentStep,
  ServicePicker,
  SlotGrid,
  TeamStrip,
  WorkGallery,
  EmployeeProfileCard,
} from './components'
import type { CardOrigin } from './components/EmployeeProfileCard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { resolvePublicPageBackground } from '@/lib/publicPageBackground'
import { bookingDerivedBackground } from '@/lib/booking'

type ThemeMode = 'DARK' | 'LIGHT'
/** The whole selection happens in 'booking'; payment and confirmation get their own screen. */
type View = 'booking' | 'payment' | 'done'

type NextFreeSlot = { service: ServiceOption; date: string; slot: string; employeeId: string | null }

/** How far ahead clients can book. */
const BOOKING_WINDOW_DAYS = 60

function isTechnicalError(msg: unknown): boolean {
  return typeof msg === 'string' && /prisma|invocation|column|database|ECONNREFUSED/i.test(msg)
}

function addDaysKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return formatDateKey(new Date(y, m - 1, d + days))
}

function dateKeyToDate(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** On phones the sections are stacked: bring the next one into view after a choice. */
function scrollToSection(id: string, opts: { always?: boolean } = {}) {
  if (typeof window === 'undefined' || (!opts.always && window.innerWidth >= 1024)) return
  window.setTimeout(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, 60)
}

const sectionCardClass =
  'rounded-2xl border border-[color:var(--booking-card-border)] bg-[color:var(--booking-card-bg)] p-4 shadow-sm md:p-5'
const sectionTitleClass = 'mb-4 text-lg font-semibold text-[color:var(--booking-fg)]'

export default function BusinessBookingPage() {
  const params = useParams()
  const slug = (params['business-slug'] as string | undefined) ?? ''
  const router = useRouter()

  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<View>('booking')

  const [selectedServices, setSelectedServices] = useState<ServiceOption[]>([])
  /** Professional chosen by the client; null = "Cualquiera". */
  const [preferredEmployeeId, setPreferredEmployeeId] = useState<string | null>(null)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [weekAvailability, setWeekAvailability] = useState<Record<string, boolean>>({})
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  /** Slots when the business has no employees (single agenda). */
  const [slots, setSlots] = useState<string[]>([])
  /** Slots per employee; the backend scopes availability per employee. */
  const [slotsByEmployee, setSlotsByEmployee] = useState<Record<string, string[]>>({})
  const [slotsLoading, setSlotsLoading] = useState(false)
  /** Bumped to refetch the day's slots (e.g. after a time was taken by someone else). */
  const [slotsRefreshKey, setSlotsRefreshKey] = useState(0)
  const [eligibleEmployeeIds, setEligibleEmployeeIds] = useState<string[] | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  /** Employee the appointment is booked with (preferred one, or first free one for "Cualquiera"). */
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)

  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [createdAppointment, setCreatedAppointment] = useState<CreatedAppointment | null>(null)

  const [paymentAmount, setPaymentAmount] = useState<number | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [mercadoPagoPreferenceId, setMercadoPagoPreferenceId] = useState<string | null>(null)
  const [mercadoPagoRedirectMode, setMercadoPagoRedirectMode] = useState<
    'idle' | 'redirecting' | 'fallback'
  >('idle')
  const mpFallbackTimerRef = useRef<number | null>(null)

  const [themeMode, setThemeMode] = useState<ThemeMode>('DARK')
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [user, setUser] = useState(() => (typeof window !== 'undefined' ? getAuthUser() : null))
  const [summaryInView, setSummaryInView] = useState(false)
  const restoredRef = useRef(false)
  /** Earliest free slot of the first service, offered in the cover as a one-tap booking. */
  const [nextFree, setNextFree] = useState<NextFreeSlot | null>(null)
  const [nextFreeLoading, setNextFreeLoading] = useState(false)
  /** Professional whose profile card is open, and the team card it flies out from. */
  const [profile, setProfile] = useState<{ employeeId: string; origin: CardOrigin } | null>(null)
  /** Slot to select once the day's slots load (set by the "Próximo turno libre" shortcut). */
  const pendingPickRef = useRef<{ date: string; slot: string; employeeId: string | null } | null>(null)

  useEffect(() => {
    setUser(getAuthUser())
  }, [])

  useEffect(() => {
    return () => {
      if (mpFallbackTimerRef.current != null) {
        window.clearTimeout(mpFallbackTimerRef.current)
        mpFallbackTimerRef.current = null
      }
    }
  }, [])

  const handleLogout = () => {
    removeAuthToken()
    setUser(null)
    router.refresh()
  }

  const isDarkTheme = themeMode === 'DARK'
  const businessFontFamily = business?.settings?.fontFamily ?? 'ROBOTO'
  const toggleTheme = () => setThemeMode((prev) => (prev === 'DARK' ? 'LIGHT' : 'DARK'))

  const { pageBackgroundColor, pageBackgroundImage } = useMemo(() => {
    const legacy = resolvePublicPageBackground(
      isDarkTheme,
      business?.settings?.publicPageBackgroundDark ?? null,
      business?.settings?.publicPageBackgroundLight ?? null
    )
    const derived = bookingDerivedBackground({
      brandColor: business?.settings?.publicBrandColor ?? null,
      intensity: (business?.settings?.publicBrandIntensity as any) ?? null,
      useGradient: business?.settings?.publicUseGradient ?? false,
      variant: isDarkTheme ? 'DARK' : 'LIGHT',
      legacyBackground: legacy,
    })
    return {
      pageBackgroundColor: derived.backgroundHex,
      pageBackgroundImage: derived.backgroundImage,
    }
  }, [
    isDarkTheme,
    business?.settings?.publicPageBackgroundDark,
    business?.settings?.publicPageBackgroundLight,
    business?.settings?.publicBrandColor,
    business?.settings?.publicBrandIntensity,
    business?.settings?.publicUseGradient,
  ])

  const goToView = useCallback((next: View) => {
    setView(next)
    if (typeof window !== 'undefined') {
      window.history.pushState({ view: next }, '', window.location.pathname)
      window.scrollTo({ top: 0 })
    }
  }, [])

  const handleOpenLogin = useCallback(() => {
    setIsLoginOpen(true)
    if (typeof window !== 'undefined') {
      window.history.pushState({ view, loginOpen: true }, '', window.location.pathname)
    }
  }, [view])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.history.replaceState({ view: 'booking' }, '', window.location.pathname)
    const onPopState = (e: PopStateEvent) => {
      setView((e.state?.view as View | undefined) ?? 'booking')
      setIsLoginOpen(false)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const html = document.documentElement
    html.classList.add('booking-body-scroll')
    return () => html.classList.remove('booking-body-scroll')
  }, [])

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    api
      .get<Business>(`/businesses/${slug}`)
      .then((res) => {
        setBusiness(res.data)
        setError(null)
        const t = res.data.theme?.toUpperCase()
        if (t === 'LIGHT' || t === 'DARK') setThemeMode(t as ThemeMode)
      })
      .catch((err) => {
        setError(err.response?.status === 404 ? 'Negocio no encontrado' : 'Error al cargar')
        setBusiness(null)
      })
      .finally(() => setLoading(false))
  }, [slug])

  // Restore the previous selection for this business after a reload.
  useEffect(() => {
    if (typeof window === 'undefined' || !business || restoredRef.current) return
    restoredRef.current = true
    const raw = window.sessionStorage.getItem(`booking:${slug}`)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as {
        serviceIds?: string[]
        selectedDate?: string | null
        preferredEmployeeId?: string | null
        clientName?: string
        clientEmail?: string
        clientPhone?: string
      }
      const restored: ServiceOption[] = []
      for (const rid of parsed.serviceIds ?? []) {
        const topLevel = business.services.find((s) => s.id === rid)
        if (topLevel) {
          restored.push({ id: topLevel.id, name: topLevel.name, price: topLevel.price, duration: topLevel.duration })
          continue
        }
        for (const s of business.services) {
          const sub = (s.subServices ?? []).find((x) => x.id === rid)
          if (sub) {
            restored.push({
              id: sub.id,
              name: `${s.name} - ${sub.name}`,
              price: sub.price,
              duration: sub.duration,
              parentServiceId: s.id,
              parentServiceName: s.name,
            })
            break
          }
        }
      }
      if (restored.length > 0) setSelectedServices(restored)
      const { dateKey: today } = getNowInArgentina()
      if (parsed.selectedDate && parsed.selectedDate >= today) {
        setSelectedDate(parsed.selectedDate)
        setCalendarMonth(dateKeyToDate(parsed.selectedDate))
      }
      if (
        parsed.preferredEmployeeId &&
        (business.employees ?? []).some((e) => e.id === parsed.preferredEmployeeId)
      ) {
        setPreferredEmployeeId(parsed.preferredEmployeeId)
      }
      if (parsed.clientName) setClientName(parsed.clientName)
      if (parsed.clientEmail) setClientEmail(parsed.clientEmail)
      if (parsed.clientPhone) setClientPhone(parsed.clientPhone)
    } catch {
      // Ignore corrupted storage.
    }
  }, [business, slug])

  useEffect(() => {
    if (typeof window === 'undefined' || !slug || !restoredRef.current) return
    window.sessionStorage.setItem(
      `booking:${slug}`,
      JSON.stringify({
        serviceIds: selectedServices.map((s) => s.id),
        selectedDate,
        preferredEmployeeId,
        clientName,
        clientEmail,
        clientPhone,
      })
    )
  }, [slug, selectedServices, selectedDate, preferredEmployeeId, clientName, clientEmail, clientPhone])

  // Adicionales solo aplican a una línea de servicio por turno (API actual).
  useEffect(() => {
    if (selectedServices.length <= 1) return
    if (!selectedServices.some((s) => s.addOns && s.addOns.length > 0)) return
    setSelectedServices((prev) => prev.map((s) => ({ ...s, addOns: undefined })))
  }, [selectedServices])

  // Paint html/body with the page background so overscroll matches the brand color.
  useEffect(() => {
    if (view === 'payment') return
    const html = document.documentElement
    const body = document.body
    const prev = [html.style.backgroundColor, body.style.backgroundColor]
    html.style.backgroundColor = pageBackgroundColor
    body.style.backgroundColor = pageBackgroundColor
    return () => {
      html.style.backgroundColor = prev[0]
      body.style.backgroundColor = prev[1]
    }
  }, [view, pageBackgroundColor])

  const serviceIdsParam = selectedServices.map((s) => s.id).join(',')

  // Which employees can perform ALL selected services.
  useEffect(() => {
    if (!business) return
    const allEmployees = business.employees ?? []
    if (allEmployees.length === 0) {
      setEligibleEmployeeIds(null)
      return
    }
    if (!serviceIdsParam) {
      setEligibleEmployeeIds(allEmployees.map((e) => e.id))
      return
    }
    api
      .get<{ employeeIds: string[] }>('/availability/eligible-employees', {
        params: { businessSlug: slug, serviceIds: serviceIdsParam },
      })
      .then((res) => setEligibleEmployeeIds(Array.isArray(res.data.employeeIds) ? res.data.employeeIds : []))
      .catch(() => setEligibleEmployeeIds([]))
  }, [business, serviceIdsParam, slug])

  // Next 7 days: grey out full days and preselect the first one with free slots.
  useEffect(() => {
    if (!business || !serviceIdsParam) {
      setWeekAvailability({})
      return
    }
    const { dateKey: todayStr } = getNowInArgentina()
    api
      .get<{ week: { date: string; hasSlots: boolean }[] }>('/availability/week', {
        params: { businessSlug: slug, serviceIds: serviceIdsParam, startDate: todayStr },
      })
      .then((res) => {
        const map: Record<string, boolean> = {}
        res.data.week.forEach((w) => {
          map[w.date] = w.hasSlots
        })
        setWeekAvailability(map)
        const firstFree = res.data.week.find((w) => w.hasSlots)?.date
        setSelectedDate((current) => {
          if (current && map[current] !== false) return current
          if (firstFree) setCalendarMonth(dateKeyToDate(firstFree))
          return firstFree ?? current
        })
      })
      .catch(() => setWeekAvailability({}))
  }, [business, serviceIdsParam, slug])

  useEffect(() => {
    if (!business || !selectedDate || !serviceIdsParam) return
    const businessEmployees = business.employees ?? []
    setSelectedSlot(null)
    setSelectedEmployeeId(null)
    if (businessEmployees.length > 0) {
      const employees = eligibleEmployeeIds
        ? businessEmployees.filter((e) => eligibleEmployeeIds.includes(e.id))
        : businessEmployees
      if (employees.length === 0) {
        setSlotsByEmployee({})
        setSlotsLoading(false)
        return
      }
      setSlotsLoading(true)
      Promise.all(
        employees.map((emp) =>
          api
            .get<{ slots: string[] }>('/availability', {
              params: { businessSlug: slug, serviceIds: serviceIdsParam, date: selectedDate, employeeId: emp.id },
            })
            .then((res) => ({ employeeId: emp.id, slots: res.data.slots }))
            .catch(() => ({ employeeId: emp.id, slots: [] as string[] }))
        )
      )
        .then((results) => {
          const byEmployee: Record<string, string[]> = {}
          results.forEach(({ employeeId, slots: s }) => {
            byEmployee[employeeId] = s
          })
          setSlotsByEmployee(byEmployee)
          applyPendingPick((employeeId) => (employeeId ? byEmployee[employeeId] ?? [] : []))
        })
        .finally(() => setSlotsLoading(false))
    } else {
      setSlotsLoading(true)
      api
        .get<{ slots: string[] }>('/availability', {
          params: { businessSlug: slug, serviceIds: serviceIdsParam, date: selectedDate },
        })
        .then((res) => {
          setSlots(res.data.slots)
          applyPendingPick(() => res.data.slots)
        })
        .catch(() => setSlots([]))
        .finally(() => setSlotsLoading(false))
    }

    function applyPendingPick(slotsOf: (employeeId: string | null) => string[]) {
      const pick = pendingPickRef.current
      if (!pick || pick.date !== selectedDate) return
      pendingPickRef.current = null
      if (!slotsOf(pick.employeeId).includes(pick.slot)) return
      setSelectedSlot(pick.slot)
      setSelectedEmployeeId(pick.employeeId)
      scrollToSection('booking-summary', { always: true })
    }
  }, [business, selectedDate, serviceIdsParam, slug, eligibleEmployeeIds, slotsRefreshKey])

  // Find the earliest free slot of the first service for the cover shortcut.
  useEffect(() => {
    if (!business) return
    const service = business.services.find((s) => !(s.subServices && s.subServices.length > 0))
    if (!service) return
    let cancelled = false
    const { dateKey: today, timeStr: now } = getNowInArgentina()
    const employeesToCheck = business.employees ?? []
    const slotsFor = (date: string, employeeId?: string) =>
      api
        .get<{ slots: string[] }>('/availability', {
          params: { businessSlug: slug, serviceIds: service.id, date, ...(employeeId ? { employeeId } : {}) },
        })
        .then((res) => res.data.slots)
        .catch(() => [] as string[])

    setNextFreeLoading(true)
    ;(async () => {
      try {
        const { data } = await api.get<{ week: { date: string; hasSlots: boolean }[] }>('/availability/week', {
          params: { businessSlug: slug, serviceIds: service.id, startDate: today },
        })
        // Today's free slots may all be in the past, so check up to two candidate days.
        for (const day of data.week.filter((w) => w.hasSlots).slice(0, 2)) {
          const lists =
            employeesToCheck.length > 0
              ? await Promise.all(
                  employeesToCheck.map(async (e) => ({ employeeId: e.id as string | null, slots: await slotsFor(day.date, e.id) }))
                )
              : [{ employeeId: null, slots: await slotsFor(day.date) }]
          let best: { slot: string; employeeId: string | null } | null = null
          for (const { employeeId, slots: list } of lists) {
            const first = list.find((s) => day.date !== today || s > now)
            if (first && (!best || first < best.slot)) best = { slot: first, employeeId }
          }
          if (best) {
            if (!cancelled) {
              setNextFree({
                service: { id: service.id, name: service.name, price: service.price, duration: service.duration },
                date: day.date,
                ...best,
              })
            }
            return
          }
        }
      } catch {
        // The shortcut is optional; the regular flow still works.
      } finally {
        if (!cancelled) setNextFreeLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [business, slug])

  // Switching professional invalidates the chosen time.
  useEffect(() => {
    setSelectedSlot(null)
    setSelectedEmployeeId(null)
  }, [preferredEmployeeId])

  // Mobile bottom bar hides once "Tu reserva" is on screen.
  useEffect(() => {
    const el = document.getElementById('booking-summary')
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setSummaryInView(entry.isIntersecting), {
      threshold: 0.15,
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [business, view])

  const employees = useMemo(() => business?.employees ?? [], [business?.employees])
  const hasEmployees = employees.length > 0
  const { dateKey: todayKey, timeStr: currentTimeArgentina } = getNowInArgentina()
  const maxDateKey = addDaysKey(todayKey, BOOKING_WINDOW_DAYS)

  /** Employees whose agenda feeds the slot grid: the preferred one, or every eligible one. */
  const candidateEmployees = useMemo(() => {
    const eligible = eligibleEmployeeIds ? employees.filter((e) => eligibleEmployeeIds.includes(e.id)) : employees
    return preferredEmployeeId ? eligible.filter((e) => e.id === preferredEmployeeId) : eligible
  }, [employees, eligibleEmployeeIds, preferredEmployeeId])

  const displaySlots = useMemo(() => {
    const raw = hasEmployees
      ? Array.from(new Set(candidateEmployees.flatMap((e) => slotsByEmployee[e.id] ?? []))).sort()
      : slots
    return selectedDate === todayKey ? raw.filter((s) => s > currentTimeArgentina) : raw
  }, [hasEmployees, candidateEmployees, slotsByEmployee, slots, selectedDate, todayKey, currentTimeArgentina])

  const openWeekdays = useMemo(
    () => new Set((business?.workingHours ?? []).filter((wh) => !wh.isClosed).map((wh) => wh.dayOfWeek)),
    [business?.workingHours]
  )

  const handleSelectServices = (next: ServiceOption[]) => {
    setSelectedServices(next)
    setSubmitError(null)
    if (next.length > selectedServices.length && !business?.settings?.allowMultipleServices) {
      scrollToSection('booking-date')
    }
  }

  /** "Próximo turno libre": select service, day, time and professional in one tap. */
  const handleQuickBook = () => {
    if (!nextFree) return
    pendingPickRef.current = { date: nextFree.date, slot: nextFree.slot, employeeId: nextFree.employeeId }
    setPreferredEmployeeId(null)
    setSelectedServices([nextFree.service])
    setSelectedDate(nextFree.date)
    setCalendarMonth(dateKeyToDate(nextFree.date))
    setSubmitError(null)
    // Refetch even when service and day were already selected, so the pick gets applied.
    setSlotsRefreshKey((k) => k + 1)
  }

  const closeProfile = useCallback(() => setProfile(null), [])

  const handleBookWith = (employeeId: string) => {
    // The chosen services may not be done by this professional: start the service choice over.
    const keepServices =
      selectedServices.length > 0 && (!eligibleEmployeeIds || eligibleEmployeeIds.includes(employeeId))
    if (!keepServices) setSelectedServices([])
    setPreferredEmployeeId(employeeId)
    setProfile(null)
    scrollToSection(keepServices ? 'booking-date' : 'booking-services', { always: true })
  }

  const handleSelectSlot = (slot: string) => {
    setSelectedSlot(slot)
    setSubmitError(null)
    if (hasEmployees) {
      const assigned = candidateEmployees.find((e) => (slotsByEmployee[e.id] ?? []).includes(slot))
      setSelectedEmployeeId(assigned?.id ?? null)
    } else {
      setSelectedEmployeeId(null)
    }
    scrollToSection('booking-summary')
  }

  const createAppointment = (opts: { deferConfirmationUntilPayment: boolean; onSuccess: () => void }) => {
    if (!business || selectedServices.length === 0 || !selectedDate || !selectedSlot) return

    const email = clientEmail.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
    if (!emailRegex.test(email)) {
      setSubmitError('Ingresá un email válido (por ejemplo, tunombre@gmail.com).')
      return
    }
    setSubmitLoading(true)
    setSubmitError(null)
    api
      .post<CreatedAppointment>('/appointments', {
        businessSlug: slug,
        ...(selectedServices.length === 1
          ? { serviceId: selectedServices[0].id }
          : { serviceIds: selectedServices.map((s) => s.id) }),
        ...(selectedServices.length === 1 && selectedServices[0].addOns?.length
          ? { addOnIds: selectedServices[0].addOns.map((a) => a.id) }
          : {}),
        date: selectedDate,
        slotTime: selectedSlot,
        clientName: clientName.trim(),
        clientEmail: email,
        clientPhone: clientPhone.trim(),
        employeeId: selectedEmployeeId,
        deferConfirmationUntilPayment: opts.deferConfirmationUntilPayment,
      })
      .then((res) => {
        setCreatedAppointment(res.data)
        opts.onSuccess()
      })
      .catch((err) => {
        const status = err.response?.status
        const msg = err.response?.data?.error
        if (status === 409) {
          // The time was taken in the meantime (or no longer applies): show why and refresh the day.
          setSubmitError(msg || 'Ese horario se acaba de ocupar. Elegí otro, por favor.')
          setSlotsRefreshKey((k) => k + 1)
          return
        }
        setSubmitError(
          status >= 500 || isTechnicalError(msg)
            ? 'No se pudo completar la reserva. Por favor intentá de nuevo.'
            : msg || 'No se pudo crear la cita'
        )
      })
      .finally(() => setSubmitLoading(false))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const requiresPayment = !!business?.settings?.paymentRequired
    createAppointment({
      deferConfirmationUntilPayment: requiresPayment,
      onSuccess: () => goToView(requiresPayment ? 'payment' : 'done'),
    })
  }

  const handleSubmitAndPay = () => {
    createAppointment({ deferConfirmationUntilPayment: true, onSuccess: () => goToView('payment') })
  }

  const primaryColor = business?.primaryColor || '#f5f5f5'

  const handleCreateMercadoPagoIntent = (payOption?: 'DEPOSIT' | 'FULL') => {
    if (!createdAppointment || selectedServices.length === 0 || !selectedDate || !selectedSlot) return
    setPaymentLoading(true)
    setPaymentError(null)
    api
      .post<{ preferenceId: string; initPoint: string; amount: number; provider: string }>(
        '/payments/create-intent',
        {
          appointmentId: createdAppointment.id,
          provider: 'MERCADOPAGO',
          payOption,
          returnOrigin: typeof window !== 'undefined' ? window.location.origin : undefined,
        }
      )
      .then((res) => {
        const storage: Record<string, string> = {
          appointmentId: createdAppointment.id,
          preferenceId: res.data.preferenceId,
          serviceName: createdAppointment.serviceName,
          startTime: createdAppointment.startTime,
          endTime: createdAppointment.endTime,
          cancellationToken: createdAppointment.cancellationToken || '',
          businessSlug: slug,
          primaryColor: primaryColor,
        }
        sessionStorage.setItem('mp_booking', JSON.stringify(storage))
        setPaymentAmount(res.data.amount)
        setMercadoPagoPreferenceId(res.data.preferenceId)

        // Prefer Mercado Pago hosted redirect (initPoint). If it doesn't redirect,
        // fall back to the embedded Brick on this page.
        if (typeof window === 'undefined' || !res.data.initPoint) {
          setMercadoPagoRedirectMode('fallback')
          return
        }
        setMercadoPagoRedirectMode('redirecting')
        if (mpFallbackTimerRef.current != null) window.clearTimeout(mpFallbackTimerRef.current)
        mpFallbackTimerRef.current = window.setTimeout(() => {
          // If we stayed on this page after a short delay, redirect likely didn't happen.
          setMercadoPagoRedirectMode('fallback')
        }, 2500)
        try {
          window.location.href = res.data.initPoint
        } catch {
          setMercadoPagoRedirectMode('fallback')
        }
      })
      .catch((err) => {
        const status = err.response?.status
        const msg = err.response?.data?.error
        setPaymentError(
          status >= 500 || isTechnicalError(msg)
            ? 'No se pudo iniciar el pago. Por favor intentá de nuevo.'
            : msg || 'No se pudo iniciar el pago'
        )
        setMercadoPagoRedirectMode('idle')
      })
      .finally(() => setPaymentLoading(false))
  }

  /** Leaving the payment screen releases the held slot and returns to the booking page. */
  const handleCancelPendingAndBack = async () => {
    if (createdAppointment?.id) {
      try {
        await api.post('/payments/cancel-pending', { appointmentId: createdAppointment.id })
      } catch {
        // If cancellation fails, we still navigate back so user can continue.
      }
    }
    setCreatedAppointment(null)
    setMercadoPagoPreferenceId(null)
    setPaymentAmount(null)
    setMercadoPagoRedirectMode('idle')
    if (mpFallbackTimerRef.current != null) {
      window.clearTimeout(mpFallbackTimerRef.current)
      mpFallbackTimerRef.current = null
    }
    setSlotsRefreshKey((k) => k + 1)
    goToView('booking')
  }

  const handleForceMercadoPagoBrick = () => {
    if (!mercadoPagoPreferenceId) return
    setMercadoPagoRedirectMode('fallback')
    if (mpFallbackTimerRef.current != null) {
      window.clearTimeout(mpFallbackTimerRef.current)
      mpFallbackTimerRef.current = null
    }
  }

  const backToBooking = useCallback(() => setView('booking'), [])

  if (loading) {
    return <LoadingSpinner variant={themeMode === 'DARK' ? 'dark' : 'light'} bgColor="bg-neutral-100" />
  }

  if (error || !business) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-100">
        <p className="text-red-600">{error || 'Negocio no encontrado'}</p>
      </main>
    )
  }

  const layoutProps = {
    businessName: business.name,
    logo: business.logo,
    isDarkTheme,
    pageBackgroundColor,
    pageBackgroundImage,
    fontFamily: businessFontFamily,
    onToggleTheme: toggleTheme,
    onOpenLogin: handleOpenLogin,
    onOpenRegister: () => router.push('/register'),
    user,
    onLogout: handleLogout,
  }

  const totalPrice = selectedServices.reduce((acc, s) => acc + serviceOptionTotalPrice(s), 0)
  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId) ?? null
  const noEligibleEmployees =
    hasEmployees && selectedServices.length > 0 && Array.isArray(eligibleEmployeeIds) && eligibleEmployeeIds.length === 0
  const dateLabel = selectedDate
    ? dateKeyToDate(selectedDate).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
    : null
  const slotPlaceholder =
    selectedServices.length === 0
      ? 'Elegí un servicio para ver los horarios.'
      : noEligibleEmployees
        ? 'Ningún profesional hace todos los servicios elegidos. Probá quitando alguno.'
        : !selectedDate
          ? 'Elegí un día en el calendario.'
          : null
  const canShowPayment = !!(createdAppointment && selectedDate && selectedSlot)

  const nextFreeLabel = (() => {
    if (!nextFree) return null
    const day =
      nextFree.date === todayKey
        ? 'hoy'
        : nextFree.date === addDaysKey(todayKey, 1)
          ? 'mañana'
          : dateKeyToDate(nextFree.date).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' })
    const who = employees.length > 1 ? employees.find((e) => e.id === nextFree.employeeId)?.name : null
    return `${nextFree.service.name} · ${day} ${nextFree.slot}${who ? ` con ${who}` : ''}`
  })()

  return (
    <main className="min-h-screen overflow-x-hidden">
      {view === 'booking' && (
        <BookingLayout
          {...layoutProps}
          showBusinessName={false}
          onGoToServices={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          topSlot={
            <BusinessHero
              name={business.name}
              description={business.description}
              logo={business.logo}
              coverPhoto={business.coverPhoto}
              coverVideo={business.coverVideo ?? null}
              coverPhotoMobile={business.coverPhotoMobile ?? null}
              coverVideoMobile={business.coverVideoMobile ?? null}
              nextSlot={nextFreeLabel ? { label: nextFreeLabel, onClick: handleQuickBook } : null}
              nextSlotLoading={nextFreeLoading}
            />
          }
        >
          <div className="flex flex-col gap-5 pb-24 md:gap-6 lg:pb-0">
            <BusinessInfoBar business={business} />
            <TeamStrip
              employees={employees}
              selectedEmployeeId={preferredEmployeeId}
              onSelect={setPreferredEmployeeId}
              onOpenProfile={(employeeId, origin) => setProfile({ employeeId, origin })}
              eligibleEmployeeIds={selectedServices.length > 0 ? eligibleEmployeeIds : null}
            />

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.9fr)] lg:items-start">
              <section id="booking-services" className={sectionCardClass} aria-labelledby="services-title">
                <h2 id="services-title" className={sectionTitleClass}>
                  1. Servicio
                </h2>
                <ServicePicker
                  business={business}
                  businessSlug={slug}
                  allowServiceAddOns={business.capabilities?.allowServiceAddOns === true}
                  selectedServices={selectedServices}
                  onSelectServices={handleSelectServices}
                  primaryColor={primaryColor}
                  pageBackgroundColor={pageBackgroundColor}
                  isDarkTheme={isDarkTheme}
                />
              </section>

              <section id="booking-date" className={`${sectionCardClass} scroll-mt-4`} aria-labelledby="date-title">
                <h2 id="date-title" className={sectionTitleClass}>
                  2. Día y horario
                </h2>
                <MonthCalendar
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  todayKey={todayKey}
                  maxDateKey={maxDateKey}
                  openWeekdays={openWeekdays}
                  availability={weekAvailability}
                  disabled={selectedServices.length === 0}
                />
                <div className="mt-5">
                  {dateLabel && !slotPlaceholder && (
                    <p className="mb-3 text-sm font-medium first-letter:uppercase text-[color:var(--booking-fg-muted)]">
                      {dateLabel}
                    </p>
                  )}
                  <SlotGrid
                    slots={displaySlots}
                    selectedSlot={selectedSlot}
                    onSelect={handleSelectSlot}
                    loading={slotsLoading}
                    placeholder={slotPlaceholder}
                  />
                </div>
              </section>

              <section
                id="booking-summary"
                className={`${sectionCardClass} scroll-mt-4 lg:sticky lg:top-6`}
                aria-labelledby="summary-title"
              >
                <h2 id="summary-title" className={sectionTitleClass}>
                  3. Tu reserva
                </h2>
                <BookingSummary
                  services={selectedServices}
                  onRemoveService={
                    business.settings?.allowMultipleServices
                      ? (svc) =>
                          setSelectedServices((prev) =>
                            prev.filter(
                              (x) => !(x.id === svc.id && (x.parentServiceId ?? '') === (svc.parentServiceId ?? ''))
                            )
                          )
                      : undefined
                  }
                  dateLabel={selectedSlot ? dateLabel : null}
                  slot={selectedSlot}
                  employeeName={selectedEmployee?.name ?? null}
                  clientName={clientName}
                  clientEmail={clientEmail}
                  clientPhone={clientPhone}
                  onClientName={setClientName}
                  onClientEmail={setClientEmail}
                  onClientPhone={setClientPhone}
                  onSubmit={handleSubmit}
                  onSubmitAndPay={handleSubmitAndPay}
                  submitLoading={submitLoading}
                  submitError={submitError}
                  paymentRequired={!!business.settings?.paymentRequired}
                  paymentOptionalEnabled={!!business.settings?.paymentOptionalEnabled}
                  primaryColor={primaryColor}
                />
              </section>
            </div>

            <WorkGallery images={business.galleryImages ?? []} businessName={business.name} />
            <EmployeeProfileCard
              employee={profile ? employees.find((e) => e.id === profile.employeeId) ?? null : null}
              origin={profile?.origin ?? null}
              business={business}
              onClose={closeProfile}
              onBookWith={handleBookWith}
            />
          </div>

          {selectedServices.length > 0 && !summaryInView && (
            <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 lg:hidden">
              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById(selectedSlot ? 'booking-summary' : 'booking-date')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                className="booking-liquid-glass booking-glass-text flex w-full items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {selectedServices.map((s) => s.name).join(' + ')}
                  </span>
                  <span className="block text-xs opacity-80">
                    $ {totalPrice.toFixed(0)}
                    {selectedSlot && dateLabel ? ` · ${dateLabel}, ${selectedSlot}` : ''}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold">
                  {selectedSlot ? 'Completar datos' : 'Elegir horario'} →
                </span>
              </button>
            </div>
          )}
        </BookingLayout>
      )}

      {view === 'payment' && canShowPayment && createdAppointment && selectedDate && selectedSlot && (
        <PaymentStep
          businessName={business.name}
          logo={business.logo}
          fontFamily={businessFontFamily}
          createdAppointment={createdAppointment}
          selectedDate={selectedDate}
          selectedSlot={selectedSlot}
          paymentType={business.settings?.paymentType ?? null}
          depositPercentage={business.settings?.depositPercentage ?? null}
          servicePrice={totalPrice}
          paymentAmount={paymentAmount}
          paymentError={paymentError}
          mercadoPagoPreferenceId={mercadoPagoPreferenceId}
          mercadoPagoPublicKey={business.settings?.mercadoPagoPublicKey ?? null}
          mercadoPagoRedirectMode={mercadoPagoRedirectMode}
          paymentLoading={paymentLoading}
          onMercadoPagoIntent={handleCreateMercadoPagoIntent}
          onPaymentError={setPaymentError}
          onMercadoPagoBack={handleCancelPendingAndBack}
          onForceMercadoPagoBrick={handleForceMercadoPagoBrick}
          onBack={handleCancelPendingAndBack}
          onGoToServices={handleCancelPendingAndBack}
          showPaymentStep
          primaryColor={primaryColor}
          pageBackgroundColor={pageBackgroundColor}
          pageBackgroundImage={pageBackgroundImage}
          isDarkTheme={isDarkTheme}
          onToggleTheme={toggleTheme}
          onOpenLogin={handleOpenLogin}
          onOpenRegister={() => router.push('/register')}
          user={user}
          onLogout={handleLogout}
        />
      )}

      {/* Payment/confirmation without an appointment (e.g. back/forward after a reload): return to booking. */}
      {((view === 'payment' && !canShowPayment) || (view === 'done' && !createdAppointment)) && (
        <ResetToBooking onReset={backToBooking} />
      )}

      {view === 'done' && createdAppointment && (
        <BookingLayout {...layoutProps} onGoToServices={() => goToView('booking')}>
          <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-12">
            <BookingDone
              appointment={createdAppointment}
              primaryColor={primaryColor}
              businessName={business.name}
              businessAddress={business.address}
            />
          </div>
        </BookingLayout>
      )}

      <LoginModal
        open={isLoginOpen}
        onClose={() => {
          if (typeof window !== 'undefined') window.history.back()
        }}
        onSuccess={(loggedInUser, token) => {
          setAuthToken(token)
          setAuthUser(loggedInUser)
          setUser(loggedInUser)
          if (loggedInUser.role === 'ADMIN' && slug) {
            setAdminActingShopSlug(slug)
            router.push('/setting')
          } else if (loggedInUser.role !== 'ADMIN') {
            clearAdminActingShopSlug()
          }
        }}
        onOpenRegister={() => router.push('/register')}
        isDarkTheme={isDarkTheme}
        storeSlug={slug || null}
      />
    </main>
  )
}

function ResetToBooking({ onReset }: { onReset: () => void }) {
  useEffect(() => {
    onReset()
  }, [onReset])
  return null
}
