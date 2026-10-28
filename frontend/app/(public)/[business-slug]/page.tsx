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
import {
  formatDateKey,
  getNowInArgentina,
  serviceOptionTotalPrice,
  servicesForEmployee,
  workingHoursForEmployee,
} from './utils'
import { Lock, Timer, X } from 'lucide-react'
import {
  BookingDone,
  BookingLayout,
  BookingSummary,
  BusinessHero,
  BusinessInfoBar,
  LoginModal,
  MonthCalendar,
  CheckoutView,
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
/** The whole selection happens in 'booking'; checkout (details + payment) and confirmation get their own screen. */
type View = 'booking' | 'checkout' | 'done'

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
function scrollToSection(id: string) {
  if (typeof window === 'undefined' || window.innerWidth >= 1024) return
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
  /** Professional chosen by the client (first step; required when the business has a team). */
  const [preferredEmployeeId, setPreferredEmployeeId] = useState<string | null>(null)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [weekAvailability, setWeekAvailability] = useState<Record<string, boolean>>({})
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  /** Free times of the chosen professional (or of the single agenda when there is no team). */
  const [slots, setSlots] = useState<string[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  /** Bumped to refetch the day's slots (e.g. after a time was taken by someone else). */
  const [slotsRefreshKey, setSlotsRefreshKey] = useState(0)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [createdAppointment, setCreatedAppointment] = useState<CreatedAppointment | null>(null)
  /** Message shown over the booking page (e.g. the checkout time ran out). */
  const [notice, setNotice] = useState<string | null>(null)

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
  /** Professional whose profile card is open, and the team card it flies out from. */
  const [profile, setProfile] = useState<{ employeeId: string; origin: CardOrigin } | null>(null)

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
      }
      const team = business.employees ?? []
      const teamSize = team.length
      const restoredEmployee =
        teamSize === 1 ? team[0] : team.find((e) => e.id === parsed.preferredEmployeeId) ?? null
      if (restoredEmployee) setPreferredEmployeeId(restoredEmployee.id)
      // Later steps only make sense once the professional is known.
      if (teamSize > 1 && !restoredEmployee) return
      const services = restoredEmployee ? servicesForEmployee(business.services, restoredEmployee) : business.services
      const restored: ServiceOption[] = []
      for (const rid of parsed.serviceIds ?? []) {
        const topLevel = services.find((s) => s.id === rid && !(s.subServices && s.subServices.length > 0))
        if (topLevel) {
          restored.push({ id: topLevel.id, name: topLevel.name, price: topLevel.price, duration: topLevel.duration })
          continue
        }
        for (const s of services) {
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
      if (restored.length === 0) return
      setSelectedServices(restored)
      const { dateKey: today } = getNowInArgentina()
      if (parsed.selectedDate && parsed.selectedDate >= today) {
        setSelectedDate(parsed.selectedDate)
        setCalendarMonth(dateKeyToDate(parsed.selectedDate))
      }
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
      })
    )
  }, [slug, selectedServices, selectedDate, preferredEmployeeId])

  // Adicionales solo aplican a una línea de servicio por turno (API actual).
  useEffect(() => {
    if (selectedServices.length <= 1) return
    if (!selectedServices.some((s) => s.addOns && s.addOns.length > 0)) return
    setSelectedServices((prev) => prev.map((s) => ({ ...s, addOns: undefined })))
  }, [selectedServices])

  // Paint html/body with the page background so overscroll matches the brand color.
  useEffect(() => {
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

  // With a team of one there is nothing to choose: that professional is the first step done.
  useEffect(() => {
    const team = business?.employees ?? []
    if (team.length === 1) setPreferredEmployeeId(team[0].id)
  }, [business])

  const teamRequired = (business?.employees ?? []).length > 0
  /** Agenda the availability is read from: the chosen professional, or the business when it has no team. */
  const agendaReady = !teamRequired || !!preferredEmployeeId

  // Next 7 days of the chosen professional: grey out full days and open the month of the first free one.
  useEffect(() => {
    if (!business || !serviceIdsParam || !agendaReady) {
      setWeekAvailability({})
      return
    }
    let cancelled = false
    const { dateKey: todayStr } = getNowInArgentina()
    api
      .get<{ week: { date: string; hasSlots: boolean }[] }>('/availability/week', {
        params: {
          businessSlug: slug,
          serviceIds: serviceIdsParam,
          startDate: todayStr,
          ...(preferredEmployeeId ? { employeeId: preferredEmployeeId } : {}),
        },
      })
      .then((res) => {
        if (cancelled) return
        const map: Record<string, boolean> = {}
        res.data.week.forEach((w) => {
          map[w.date] = w.hasSlots
        })
        setWeekAvailability(map)
        const firstFree = res.data.week.find((w) => w.hasSlots)?.date
        // The day is the client's choice: keep it if still free, otherwise clear it.
        setSelectedDate((current) => {
          if (current && map[current] !== false) return current
          if (firstFree) setCalendarMonth(dateKeyToDate(firstFree))
          return null
        })
      })
      .catch(() => {
        if (!cancelled) setWeekAvailability({})
      })
    return () => {
      cancelled = true
    }
  }, [business, serviceIdsParam, slug, agendaReady, preferredEmployeeId])

  useEffect(() => {
    setSelectedSlot(null)
    if (!business || !selectedDate || !serviceIdsParam || !agendaReady) {
      setSlots([])
      return
    }
    let cancelled = false
    setSlotsLoading(true)
    api
      .get<{ slots: string[] }>('/availability', {
        params: {
          businessSlug: slug,
          serviceIds: serviceIdsParam,
          date: selectedDate,
          ...(preferredEmployeeId ? { employeeId: preferredEmployeeId } : {}),
        },
      })
      .then((res) => {
        if (cancelled) return
        setSlots(res.data.slots)
      })
      .catch(() => {
        if (!cancelled) setSlots([])
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [business, selectedDate, serviceIdsParam, slug, agendaReady, preferredEmployeeId, slotsRefreshKey])

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
  const preferredEmployee = employees.find((e) => e.id === preferredEmployeeId) ?? null
  const { dateKey: todayKey, timeStr: currentTimeArgentina } = getNowInArgentina()
  const maxDateKey = addDaysKey(todayKey, BOOKING_WINDOW_DAYS)

  /** Only what the chosen professional does is offered. */
  const bookableBusiness = useMemo(
    () =>
      business && preferredEmployee
        ? { ...business, services: servicesForEmployee(business.services, preferredEmployee) }
        : business,
    [business, preferredEmployee]
  )

  const displaySlots = useMemo(
    () => (selectedDate === todayKey ? slots.filter((s) => s > currentTimeArgentina) : slots),
    [slots, selectedDate, todayKey, currentTimeArgentina]
  )

  /** Weekdays the chosen professional works (business hours when they have no own schedule). */
  const openWeekdays = useMemo(
    () =>
      new Set(
        (business ? workingHoursForEmployee(business, preferredEmployee) : [])
          .filter((wh) => !wh.isClosed)
          .map((wh) => wh.dayOfWeek)
      ),
    [business, preferredEmployee]
  )

  const handleSelectServices = (next: ServiceOption[]) => {
    setSelectedServices(next)
    setSubmitError(null)
    if (next.length > selectedServices.length && !business?.settings?.allowMultipleServices) {
      scrollToSection('booking-date')
    }
  }

  const closeProfile = useCallback(() => setProfile(null), [])

  const handleSelectEmployee = (employeeId: string) => {
    if (employeeId === preferredEmployeeId) return
    const employee = employees.find((e) => e.id === employeeId)
    if (!employee) return
    // Keep only the services this professional does.
    const offered = servicesForEmployee(business?.services ?? [], employee)
    const doesIt = (s: ServiceOption) =>
      s.parentServiceId
        ? offered.some((o) => o.id === s.parentServiceId && (o.subServices ?? []).some((sub) => sub.id === s.id))
        : offered.some((o) => o.id === s.id)
    const kept = selectedServices.filter(doesIt)
    if (kept.length !== selectedServices.length) setSelectedServices(kept)
    setPreferredEmployeeId(employeeId)
    setSubmitError(null)
    scrollToSection(kept.length > 0 ? 'booking-date' : 'booking-services')
  }

  const handleSelectSlot = (slot: string) => {
    setSelectedSlot(slot)
    setSubmitError(null)
    scrollToSection('booking-summary')
  }

  const validEmail = (): string | null => {
    const email = clientEmail.trim()
    if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return email
    setSubmitError('Ingresá un email válido (por ejemplo, tunombre@gmail.com).')
    return null
  }

  const selectionPayload = () => ({
    businessSlug: slug,
    ...(selectedServices.length === 1
      ? { serviceId: selectedServices[0].id }
      : { serviceIds: selectedServices.map((s) => s.id) }),
    ...(selectedServices.length === 1 && selectedServices[0].addOns?.length
      ? { addOnIds: selectedServices[0].addOns.map((a) => a.id) }
      : {}),
    date: selectedDate,
    slotTime: selectedSlot,
    employeeId: preferredEmployeeId,
  })

  const showSubmitError = (err: any, fallback: string) => {
    const status = err.response?.status
    const msg = err.response?.data?.error
    if (status === 409) {
      // The time was taken in the meantime (or no longer applies): show why and refresh the day.
      setSubmitError(msg || 'Ese horario se acaba de ocupar. Elegí otro, por favor.')
      setSlotsRefreshKey((k) => k + 1)
      return
    }
    setSubmitError(status >= 500 || isTechnicalError(msg) ? fallback : msg || fallback)
  }

  /** Free bookings: details are in "Tu reserva" and the booking is confirmed right away. */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!business || selectedServices.length === 0 || !selectedDate || !selectedSlot) return
    const email = validEmail()
    if (!email) return
    setSubmitLoading(true)
    setSubmitError(null)
    api
      .post<CreatedAppointment>('/appointments', {
        ...selectionPayload(),
        clientName: clientName.trim(),
        clientEmail: email,
        clientPhone: clientPhone.trim(),
      })
      .then((res) => {
        setCreatedAppointment(res.data)
        goToView('done')
      })
      .catch((err) => showSubmitError(err, 'No se pudo completar la reserva. Por favor intentá de nuevo.'))
      .finally(() => setSubmitLoading(false))
  }

  /** Businesses that take payments: hold the slot and move to the checkout screen. */
  const handleContinueToCheckout = () => {
    if (!business || selectedServices.length === 0 || !selectedDate || !selectedSlot) return
    setSubmitLoading(true)
    setSubmitError(null)
    api
      .post<CreatedAppointment>('/appointments/hold', selectionPayload())
      .then((res) => {
        setCreatedAppointment(res.data)
        setPaymentError(null)
        goToView('checkout')
      })
      .catch((err) => showSubmitError(err, 'No se pudo reservar el horario. Por favor intentá de nuevo.'))
      .finally(() => setSubmitLoading(false))
  }

  /** Checkout: save the details, then pay online or confirm a pay-at-shop booking. */
  const completeCheckout = (payAt: 'ONLINE' | 'SHOP', onSaved: () => void) => {
    if (!createdAppointment) return
    const email = validEmail()
    if (!email) return
    setSubmitLoading(true)
    setSubmitError(null)
    setPaymentError(null)
    api
      .post<CreatedAppointment>(`/appointments/${createdAppointment.id}/checkout`, {
        cancellationToken: createdAppointment.cancellationToken,
        clientName: clientName.trim(),
        clientEmail: email,
        clientPhone: clientPhone.trim(),
        payAt,
      })
      .then((res) => {
        setCreatedAppointment(res.data)
        onSaved()
      })
      .catch((err) => {
        if (err.response?.status === 410) {
          // The hold ran out: the timer shows the expired state.
          setCreatedAppointment((prev) => (prev ? { ...prev, paymentHoldExpiresAt: new Date().toISOString() } : prev))
        }
        showSubmitError(err, 'No se pudo confirmar la reserva. Por favor intentá de nuevo.')
      })
      .finally(() => setSubmitLoading(false))
  }

  const primaryColor = business?.primaryColor || '#f5f5f5'

  const handleCreateMercadoPagoIntent = (payOption?: 'DEPOSIT' | 'FULL') => {
    if (!createdAppointment || selectedServices.length === 0 || !selectedDate || !selectedSlot) return
    setPaymentLoading(true)
    setPaymentError(null)
    api
      .post<{
        preferenceId: string
        initPoint: string
        amount: number
        provider: string
        paymentHoldExpiresAt: string | null
      }>(
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
        // The hold is extended while paying on Mercado Pago.
        setCreatedAppointment((prev) => (prev ? { ...prev, paymentHoldExpiresAt: res.data.paymentHoldExpiresAt } : prev))

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

  /** Leaving the checkout releases the held slot (see the effect below) and returns to the booking page. */
  const handleCancelPendingAndBack = () => {
    setSubmitError(null)
    setPaymentError(null)
    setMercadoPagoPreferenceId(null)
    setPaymentAmount(null)
    setMercadoPagoRedirectMode('idle')
    if (mpFallbackTimerRef.current != null) {
      window.clearTimeout(mpFallbackTimerRef.current)
      mpFallbackTimerRef.current = null
    }
    goToView('booking')
  }

  // Back on the booking page from the checkout (our button or the browser's): free the held slot
  // so the client can pick it again, then refresh the day's times.
  const prevViewRef = useRef<View>(view)
  useEffect(() => {
    const prev = prevViewRef.current
    prevViewRef.current = view
    if (prev !== 'checkout' || view !== 'booking' || !createdAppointment) return
    const held = createdAppointment
    setCreatedAppointment(null)
    api
      .post('/payments/cancel-pending', { appointmentId: held.id })
      .catch(() => {
        // The hold expires on its own anyway.
      })
      .finally(() => setSlotsRefreshKey((k) => k + 1))
  }, [view, createdAppointment])

  const handleCheckoutExpired = () => {
    setNotice('Se terminó el tiempo para completar tu reserva y liberamos el horario. Elegilo de nuevo si sigue libre.')
    handleCancelPendingAndBack()
  }

  // Notices hide on their own after a few seconds.
  useEffect(() => {
    if (!notice) return
    const id = window.setTimeout(() => setNotice(null), 8000)
    return () => window.clearTimeout(id)
  }, [notice])

  // A finished booking doesn't leave the client's details around for the next one.
  useEffect(() => {
    if (view !== 'done') return
    setClientName('')
    setClientEmail('')
    setClientPhone('')
  }, [view])

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
  const dateLabel = selectedDate
    ? dateKeyToDate(selectedDate).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
    : null
  // Steps go in order: professional → service → day → time → details. Each one unlocks the next.
  const showTeamStep = employees.length > 1
  const stepOffset = showTeamStep ? 1 : 0
  const servicesLocked = !agendaReady
  const dateLocked = servicesLocked || selectedServices.length === 0
  const slotPlaceholder = servicesLocked
    ? 'Elegí un profesional para empezar.'
    : selectedServices.length === 0
      ? 'Elegí un servicio para ver los días disponibles.'
      : !selectedDate
        ? 'Elegí un día en el calendario.'
        : null
  const canShowCheckout = !!(createdAppointment && selectedDate && selectedSlot && dateLabel)
  const takesPayments = !!(business.settings?.paymentRequired || business.settings?.paymentOptionalEnabled)

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
            />
          }
        >
          <div className="flex flex-col gap-5 pb-24 md:gap-6 lg:pb-0">
            <BusinessInfoBar business={business} />
            <TeamStrip
              employees={employees}
              selectedEmployeeId={preferredEmployeeId}
              onSelect={handleSelectEmployee}
              onOpenProfile={(employeeId, origin) => setProfile({ employeeId, origin })}
              title="1. Elegí tu profesional"
            />

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.9fr)] lg:items-start">
              <section
                id="booking-services"
                className={`${sectionCardClass} scroll-mt-4`}
                aria-labelledby="services-title"
              >
                <h2 id="services-title" className={sectionTitleClass}>
                  {stepOffset + 1}. Servicio
                  {preferredEmployee && showTeamStep && (
                    <span className="ml-2 text-sm font-normal text-[color:var(--booking-fg-muted)]">
                      con {preferredEmployee.name}
                    </span>
                  )}
                </h2>
                {servicesLocked ? (
                  <LockedStep>Primero elegí con quién te querés atender.</LockedStep>
                ) : (
                  <ServicePicker
                    business={bookableBusiness ?? business}
                    businessSlug={slug}
                    allowServiceAddOns={business.capabilities?.allowServiceAddOns === true}
                    selectedServices={selectedServices}
                    onSelectServices={handleSelectServices}
                    primaryColor={primaryColor}
                    pageBackgroundColor={pageBackgroundColor}
                    isDarkTheme={isDarkTheme}
                  />
                )}
              </section>

              <section
                id="booking-date"
                className={`${sectionCardClass} scroll-mt-4 transition-opacity ${dateLocked ? 'opacity-60' : ''}`}
                aria-labelledby="date-title"
              >
                <h2 id="date-title" className={sectionTitleClass}>
                  {stepOffset + 2}. Día y horario
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
                  disabled={dateLocked}
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
                  {stepOffset + 3}. Tu reserva
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
                  employeeName={showTeamStep ? preferredEmployee?.name ?? null : null}
                  employeeMissing={servicesLocked}
                  clientName={clientName}
                  clientEmail={clientEmail}
                  clientPhone={clientPhone}
                  onClientName={setClientName}
                  onClientEmail={setClientEmail}
                  onClientPhone={setClientPhone}
                  onSubmit={handleSubmit}
                  onContinueToCheckout={takesPayments ? handleContinueToCheckout : undefined}
                  submitLoading={submitLoading}
                  submitError={submitError}
                />
              </section>
            </div>

            <WorkGallery images={business.galleryImages ?? []} businessName={business.name} />
            <EmployeeProfileCard
              employee={profile ? employees.find((e) => e.id === profile.employeeId) ?? null : null}
              origin={profile?.origin ?? null}
              business={business}
              onClose={closeProfile}
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

      {view === 'checkout' && canShowCheckout && createdAppointment && dateLabel && selectedSlot && (
        <BookingLayout {...layoutProps} onGoToServices={handleCancelPendingAndBack}>
          <CheckoutView
            services={selectedServices}
            dateLabel={dateLabel}
            slot={selectedSlot}
            employeeName={showTeamStep ? preferredEmployee?.name ?? null : null}
            holdExpiresAt={createdAppointment.paymentHoldExpiresAt ?? null}
            clientName={clientName}
            clientEmail={clientEmail}
            clientPhone={clientPhone}
            onClientName={setClientName}
            onClientEmail={setClientEmail}
            onClientPhone={setClientPhone}
            paymentRequired={!!business.settings?.paymentRequired}
            depositPercentage={
              business.settings?.paymentType === 'PERCENTAGE' ? business.settings?.depositPercentage ?? null : null
            }
            submitLoading={submitLoading || paymentLoading}
            submitError={submitError || paymentError}
            onPayOnline={(amount) => completeCheckout('ONLINE', () => handleCreateMercadoPagoIntent(amount))}
            onPayAtShop={() => completeCheckout('SHOP', () => goToView('done'))}
            onBack={handleCancelPendingAndBack}
            onExpire={handleCheckoutExpired}
            mercadoPagoRedirectMode={mercadoPagoRedirectMode}
            mercadoPagoPreferenceId={mercadoPagoPreferenceId}
            mercadoPagoPublicKey={business.settings?.mercadoPagoPublicKey ?? null}
            paymentAmount={paymentAmount}
            onPaymentError={setPaymentError}
            onForceMercadoPagoBrick={handleForceMercadoPagoBrick}
          />
        </BookingLayout>
      )}

      {/* Checkout/confirmation without an appointment (e.g. back/forward after a reload): return to booking. */}
      {((view === 'checkout' && !canShowCheckout) || (view === 'done' && !createdAppointment)) && (
        <ResetToBooking onReset={backToBooking} />
      )}

      {view === 'done' && createdAppointment && (
        <BookingLayout {...layoutProps} onGoToServices={() => goToView('booking')}>
          <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-12">
            <BookingDone
              appointment={createdAppointment}
              businessName={business.name}
              businessAddress={business.address}
            />
          </div>
        </BookingLayout>
      )}

      {notice && (
        <div className="fixed inset-x-0 top-4 z-[90] flex justify-center px-4" role="status" aria-live="polite">
          <div className="flex w-full max-w-md items-start gap-3 rounded-2xl bg-red-600 px-4 py-3 text-sm font-medium text-white shadow-xl">
            <Timer className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <p className="flex-1">{notice}</p>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="-mr-1 rounded-full p-1 hover:bg-white/15"
              aria-label="Cerrar aviso"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
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

/** Placeholder for a step that unlocks once the previous one is done. */
function LockedStep({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-[color:var(--booking-border)] px-4 py-6 text-sm text-[color:var(--booking-fg-muted)]">
      <Lock className="h-4 w-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  )
}

function ResetToBooking({ onReset }: { onReset: () => void }) {
  useEffect(() => {
    onReset()
  }, [onReset])
  return null
}
