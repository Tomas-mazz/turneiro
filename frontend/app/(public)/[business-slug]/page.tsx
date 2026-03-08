'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { getAuthUser, removeAuthToken, setAuthToken, setAuthUser } from '@/lib/auth'
import type { Business, Step, ServiceOption, CreatedAppointment } from './types'
import { formatDateKey, getNowInArgentina } from './utils'
import {
  BookingHero,
  BookingDone,
  ClientFormStep,
  DateStep,
  LoginModal,
  PaymentStep,
  ServiceStep,
} from './components'

type ThemeMode = 'DARK' | 'LIGHT'

function isTechnicalError(msg: unknown): boolean {
  return typeof msg === 'string' && /prisma|invocation|column|database|ECONNREFUSED/i.test(msg)
}

function getStepFromHistory(): Step {
  if (typeof window === 'undefined') return 'hero'
  const s = window.history.state?.step
  return s && ['hero', 'service', 'date', 'form', 'payment', 'done'].includes(s) ? s : 'hero'
}

export default function BusinessBookingPage() {
  const params = useParams()
  const slug = (params['business-slug'] as string | undefined) ?? ''
  const pathname = usePathname()
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [step, setStep] = useState<Step>(getStepFromHistory)
  const [selectedService, setSelectedService] = useState<ServiceOption | null>(null)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [weekAvailability, setWeekAvailability] = useState<Record<string, boolean>>({})
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slots, setSlots] = useState<string[]>([])
  /** When there are employees, slots per employeeId; backend scopes availability per employee. */
  const [slotsByEmployee, setSlotsByEmployee] = useState<Record<string, string[]>>({})
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
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
  const [themeMode, setThemeMode] = useState<ThemeMode>('DARK')
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [user, setUser] = useState(() => (typeof window !== 'undefined' ? getAuthUser() : null))
  const router = useRouter()

  useEffect(() => {
    setUser(getAuthUser())
  }, [])

  const handleLogout = () => {
    removeAuthToken()
    setUser(null)
    router.refresh()
  }

  const isDarkTheme = themeMode === 'DARK'

  const goToStep = useCallback(
    (nextStep: Step) => {
      setStep(nextStep)
      if (typeof window !== 'undefined') {
        window.history.pushState({ step: nextStep }, '', pathname ?? `/${slug}`)
      }
    },
    [pathname, slug]
  )

  const handleBack = useCallback(() => {
    if (typeof window !== 'undefined') window.history.back()
  }, [])

  const handleOpenLogin = useCallback(() => {
    setIsLoginOpen(true)
    if (typeof window !== 'undefined') {
      window.history.pushState({ step, loginOpen: true }, '', pathname ?? `/${slug}`)
    }
  }, [pathname, slug, step])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.history.replaceState({ step }, '', pathname ?? `/${slug}`)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- only set initial history entry once

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onPopState = (e: PopStateEvent) => {
      setStep(e.state?.step ?? 'hero')
      setIsLoginOpen(false)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // Reserve scrollbar space only when the body scrolls (not on hero with overflow-hidden).
  // Avoids double gutter when a section has its own overflow-y.
  useEffect(() => {
    if (typeof document === 'undefined') return
    const html = document.documentElement
    if (step === 'hero') {
      html.classList.remove('booking-body-scroll')
    } else {
      html.classList.add('booking-body-scroll')
    }
    return () => html.classList.remove('booking-body-scroll')
  }, [step])

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    api
      .get<Business>(`/businesses/${slug}`)
      .then((res) => {
        setBusiness(res.data)
        setError(null)
      })
      .catch((err) => {
        setError(err.response?.status === 404 ? 'Negocio no encontrado' : 'Error al cargar')
        setBusiness(null)
      })
      .finally(() => setLoading(false))
  }, [slug])

  // Restore previous booking state (step + basic selections) for this business
  // so that a full reload keeps the user on the same section when possible.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!business) return

    // If we already have an appointment and are showing the confirmation
    // screen, don't override the current step with older persisted state.
    if (createdAppointment && step === 'done') return

    const storageKey = `booking:${slug}`
    const raw = window.sessionStorage.getItem(storageKey)
    if (!raw) return

    try {
      const parsed = JSON.parse(raw) as {
        step?: Step
        serviceId?: string
        calendarMonth?: string
        selectedDate?: string | null
        selectedSlot?: string | null
        selectedEmployeeId?: string | null
        clientName?: string
        clientEmail?: string
        clientPhone?: string
      }

      const service =
        parsed.serviceId && business.services
          ? business.services.find((s) => s.id === parsed.serviceId) ?? null
          : null

      if (service) {
        setSelectedService(service)
      }
      if (parsed.calendarMonth) {
        const d = new Date(parsed.calendarMonth)
        if (!Number.isNaN(d.getTime())) {
          setCalendarMonth(d)
        }
      }
      if (parsed.selectedDate) setSelectedDate(parsed.selectedDate)
      if (parsed.selectedSlot) setSelectedSlot(parsed.selectedSlot)
      if (parsed.selectedEmployeeId !== undefined) setSelectedEmployeeId(parsed.selectedEmployeeId)
      if (parsed.clientName) setClientName(parsed.clientName)
      if (parsed.clientEmail) setClientEmail(parsed.clientEmail)
      if (parsed.clientPhone) setClientPhone(parsed.clientPhone)

      // Decide the safest step we can restore given the data we have.
      const requestedStep = parsed.step ?? step
      const hasService = !!service
      const hasDate = !!parsed.selectedDate
      const hasSlot = !!parsed.selectedSlot

      let nextStep: Step = 'hero'
      if (requestedStep === 'payment') {
        // Do not restore directly to payment because we don't persist createdAppointment.
        nextStep = hasService && hasDate && hasSlot ? 'form' : hasService ? 'date' : 'service'
      } else if (requestedStep === 'form') {
        nextStep = hasService && hasDate && hasSlot ? 'form' : hasService ? 'date' : 'service'
      } else if (requestedStep === 'date') {
        nextStep = hasService ? 'date' : 'service'
      } else if (requestedStep === 'service') {
        nextStep = 'service'
      } else if (requestedStep === 'hero') {
        nextStep = 'hero'
      } else if (requestedStep === 'done' && createdAppointment) {
        nextStep = 'done'
      } else {
        nextStep = 'hero'
      }

      if (nextStep !== step) {
        setStep(nextStep)
        window.history.replaceState({ step: nextStep }, '', pathname ?? `/${slug}`)
      }
    } catch {
      // Ignore corrupted storage, fallback to current step.
    }
    // We intentionally omit `step` from deps to avoid re-running after we adjust it here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business, slug, pathname, createdAppointment])

  // Persist current step and basic booking state so reloads can restore it.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!slug) return

    const storageKey = `booking:${slug}`
    const serviceId = selectedService?.id

    const payload = {
      step,
      serviceId,
      calendarMonth: calendarMonth.toISOString(),
      selectedDate,
      selectedSlot,
      selectedEmployeeId,
      clientName,
      clientEmail,
      clientPhone,
    }

    window.sessionStorage.setItem(storageKey, JSON.stringify(payload))
  }, [
    slug,
    step,
    selectedService,
    calendarMonth,
    selectedDate,
    selectedSlot,
    selectedEmployeeId,
    clientName,
    clientEmail,
    clientPhone,
  ])

  // Background for service and date steps (dark or light theme)
  useEffect(() => {
    if (step !== 'service' && step !== 'date') return
    const prevHtml = document.documentElement.style.backgroundColor
    const prevBody = document.body.style.backgroundColor
    const prevHtmlTransition = document.documentElement.style.transition
    const prevBodyTransition = document.body.style.transition
    const bg = isDarkTheme ? 'hsl(0, 0%, 9%)' : 'rgb(244, 244, 245)'
    document.documentElement.style.transition = 'background-color 240ms ease-out'
    document.body.style.transition = 'background-color 240ms ease-out'
    document.documentElement.style.backgroundColor = bg
    document.body.style.backgroundColor = bg
    return () => {
      document.documentElement.style.backgroundColor = prevHtml
      document.body.style.backgroundColor = prevBody
      document.documentElement.style.transition = prevHtmlTransition
      document.body.style.transition = prevBodyTransition
    }
  }, [step, isDarkTheme])

  // If we land on a deep step (form/payment) without the required state
  // (e.g. corrupted state or direct navigation), reset to a safe starting step
  // instead of rendering an empty screen. Prefer keeping the user inside
  // the booking flow (service/date) instead of sending them back to hero.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!business) return

    const hasCoreSelection = !!(selectedService && selectedDate && selectedSlot)

    if (!hasCoreSelection && (step === 'form' || step === 'payment')) {
      const fallbackStep: Step = selectedService ? 'date' : 'service'
      setStep(fallbackStep)
      window.history.replaceState({ step: fallbackStep }, '', pathname ?? `/${slug}`)
      return
    }

    if (step === 'payment' && !createdAppointment) {
      const fallbackStep: Step = hasCoreSelection ? 'form' : selectedService ? 'date' : 'service'
      setStep(fallbackStep)
      window.history.replaceState({ step: fallbackStep }, '', pathname ?? `/${slug}`)
    }
  }, [
    step,
    business,
    selectedService,
    selectedDate,
    selectedSlot,
    createdAppointment,
    pathname,
    slug,
  ])

  useEffect(() => {
    if (step !== 'date' || !business || !selectedService) return
    const startStr = formatDateKey(calendarMonth)
    const { dateKey: todayStr, timeStr: currentTimeStr } = getNowInArgentina()
    api
      .get<{ week: { date: string; hasSlots: boolean }[] }>('/availability/week', {
        params: {
          businessSlug: slug,
          serviceId: selectedService.id,
          startDate: startStr,
          today: todayStr,
          currentTime: currentTimeStr,
        },
      })
      .then((res) => {
        const map: Record<string, boolean> = {}
        res.data.week.forEach((w) => {
          map[w.date] = w.hasSlots
        })
        setWeekAvailability(map)
      })
      .catch(() => setWeekAvailability({}))
  }, [step, business, selectedService, slug, calendarMonth])

  useEffect(() => {
    if (!selectedDate || !selectedService) return
    const employees = business?.employees ?? []
    setSlotsLoading(true)
    setSelectedSlot(null)
    setSelectedEmployeeId(null)

    if (employees.length > 0) {
      // Per-employee availability: fetch slots for each employee so each has their own agenda.
      Promise.all(
        employees.map((emp) =>
          api
            .get<{ slots: string[] }>('/availability', {
              params: {
                businessSlug: slug,
                serviceId: selectedService.id,
                date: selectedDate,
                employeeId: emp.id,
              },
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
          setSlots([])
        })
        .finally(() => setSlotsLoading(false))
    } else {
      api
        .get<{ slots: string[] }>('/availability', {
          params: {
            businessSlug: slug,
            serviceId: selectedService.id,
            date: selectedDate,
          },
        })
        .then((res) => {
          setSlots(res.data.slots)
          setSlotsByEmployee({})
        })
        .catch(() => setSlots([]))
        .finally(() => setSlotsLoading(false))
    }
  }, [selectedDate, selectedService, slug, business?.employees])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!business || !selectedService || !selectedDate || !selectedSlot) return

    const email = clientEmail.trim()
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i
    if (!gmailRegex.test(email)) {
      setSubmitError('Ingresá un Gmail válido (por ejemplo, tuusuario@gmail.com).')
      return
    }
    setSubmitLoading(true)
    setSubmitError(null)
    api
      .post<CreatedAppointment>('/appointments', {
        businessSlug: slug,
        serviceId: selectedService.id,
        date: selectedDate,
        slotTime: selectedSlot,
        clientName: clientName.trim(),
        clientEmail: email,
        clientPhone: clientPhone.trim(),
        employeeId: selectedEmployeeId,
      })
      .then((res) => {
        setCreatedAppointment(res.data)
        // For now, always finalize the booking immediately after creating
        // the appointment and show the confirmation screen. The payment
        // step remains available separately when needed.
        goToStep('done')
      })
      .catch((err) => {
        const status = err.response?.status
        const msg = err.response?.data?.error
        const isServerError = status >= 500
        setSubmitError(
          isServerError || isTechnicalError(msg)
            ? 'No se pudo completar la reserva. Por favor intentá de nuevo.'
            : (msg || 'No se pudo crear la cita')
        )
      })
      .finally(() => setSubmitLoading(false))
  }

  const handleCreateMercadoPagoIntent = () => {
    if (!createdAppointment || !selectedService || !selectedDate || !selectedSlot) return
    setPaymentLoading(true)
    setPaymentError(null)
    api
      .post<{ preferenceId: string; initPoint: string; amount: number; provider: string }>(
        '/payments/create-intent',
        { appointmentId: createdAppointment.id, provider: 'MERCADOPAGO' }
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
        }
        sessionStorage.setItem('mp_booking', JSON.stringify(storage))
        window.location.href = res.data.initPoint
      })
      .catch((err) => {
        const status = err.response?.status
        const msg = err.response?.data?.error
        const isServerError = status >= 500
        setPaymentError(
          isServerError || isTechnicalError(msg)
            ? 'No se pudo iniciar el pago. Por favor intentá de nuevo.'
            : (msg || 'No se pudo iniciar el pago')
        )
      })
      .finally(() => setPaymentLoading(false))
  }

  const primaryColor = business?.primaryColor || '#f5f5f5'
  const { dateKey: todayKey, timeStr: currentTimeArgentina } = getNowInArgentina()

  // Unified calendar: unique slots across all employees, and which employees are available per slot (creation order).
  const { unifiedSlots, employeesBySlot } = useMemo(() => {
    const employees = business?.employees ?? []
    if (!selectedDate || employees.length === 0) {
      return { unifiedSlots: [] as string[], employeesBySlot: {} as Record<string, string[]> }
    }
    const allSlotTimesSet = new Set<string>()
    for (const slotList of Object.values(slotsByEmployee)) {
      for (const s of slotList) allSlotTimesSet.add(s)
    }
    const allSlotTimes = Array.from(allSlotTimesSet).sort()
    const isToday = selectedDate === todayKey
    const filteredSlots = isToday
      ? allSlotTimes.filter((s) => s > currentTimeArgentina)
      : allSlotTimes
    const bySlot: Record<string, string[]> = {}
    for (const slot of allSlotTimes) {
      const ids: string[] = []
      for (const emp of employees) {
        if ((slotsByEmployee[emp.id] ?? []).includes(slot)) ids.push(emp.id)
      }
      bySlot[slot] = ids
    }
    return { unifiedSlots: filteredSlots, employeesBySlot: bySlot }
  }, [
    business?.employees,
    selectedDate,
    slotsByEmployee,
    todayKey,
    currentTimeArgentina,
  ])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-100">
        <p className="text-neutral-600">Cargando...</p>
      </main>
    )
  }

  if (error || !business) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-100">
        <p className="text-red-600">{error || 'Negocio no encontrado'}</p>
      </main>
    )
  }

  return (
    <main
      className={
        step === 'hero'
          ? 'min-h-screen h-screen overflow-hidden bg-neutral-100 transition-colors duration-300 ease-out'
          : 'min-h-screen overflow-x-hidden bg-neutral-100 transition-colors duration-300 ease-out'
      }
      style={
        step === 'service' || step === 'date' || step === 'done'
          ? { backgroundColor: isDarkTheme ? 'hsl(0, 0%, 9%)' : 'rgb(244, 244, 245)' }
          : undefined
      }
    >
      {step === 'hero' && (
        <BookingHero
          name={business.name}
          coverPhoto={business.coverPhoto}
          coverVideo={business.coverVideo ?? null}
          primaryColor={primaryColor}
          onReservar={() => goToStep('service')}
        />
      )}

      {step === 'service' && (
        <ServiceStep
          business={business}
          selectedService={selectedService}
          onSelectService={setSelectedService}
          onContinue={() => goToStep('date')}
          onGoToServices={() => goToStep('service')}
          primaryColor={primaryColor}
          isDarkTheme={isDarkTheme}
          onToggleTheme={() => setThemeMode((prev) => (prev === 'DARK' ? 'LIGHT' : 'DARK'))}
          onOpenLogin={handleOpenLogin}
          onOpenRegister={() => {
            if (typeof window !== 'undefined') window.history.back()
            router.push('/register')
          }}
          user={user}
          onLogout={handleLogout}
        />
      )}

      {step === 'date' && selectedService && (
        <DateStep
          businessName={business.name}
          selectedService={selectedService}
          employees={business.employees ?? []}
          calendarMonth={calendarMonth}
          onCalendarMonth={setCalendarMonth}
          weekAvailability={weekAvailability}
          selectedDate={selectedDate}
          onSelectedDate={setSelectedDate}
          todayKey={todayKey}
          currentTimeStr={currentTimeArgentina}
          slots={slots}
          slotsByEmployee={slotsByEmployee}
          unifiedSlots={unifiedSlots}
          employeesBySlot={employeesBySlot}
          slotsLoading={slotsLoading}
          selectedSlot={selectedSlot}
          onSelectedSlot={(slot, employeeId) => {
            setSelectedSlot(slot)
            setSelectedEmployeeId(employeeId)
          }}
          onContinue={() => goToStep('form')}
          onBack={handleBack}
          onGoToServices={() => goToStep('service')}
          primaryColor={primaryColor}
          isDarkTheme={isDarkTheme}
          onToggleTheme={() => setThemeMode((prev) => (prev === 'DARK' ? 'LIGHT' : 'DARK'))}
          onOpenLogin={handleOpenLogin}
          onOpenRegister={() => {
            if (typeof window !== 'undefined') window.history.back()
            router.push('/register')
          }}
          user={user}
          onLogout={handleLogout}
        />
      )}

      {step === 'form' && selectedService && selectedDate && selectedSlot && (
        <ClientFormStep
          businessName={business.name}
          selectedService={selectedService}
          selectedDate={selectedDate}
          selectedSlot={selectedSlot}
          clientName={clientName}
          clientEmail={clientEmail}
          clientPhone={clientPhone}
          onClientName={setClientName}
          onClientEmail={setClientEmail}
          onClientPhone={setClientPhone}
          onSubmit={handleSubmit}
          submitLoading={submitLoading}
          submitError={submitError}
          createdAppointment={createdAppointment}
          onContinueToPayment={
            business.settings?.paymentRequired && createdAppointment
              ? () => goToStep('payment')
              : undefined
          }
          onBack={handleBack}
          onBackToCalendar={
            business.settings?.paymentRequired && createdAppointment
              ? () => {
                  setCreatedAppointment(null)
                  goToStep('date')
                }
              : undefined
          }
          onGoToServices={() => goToStep('service')}
          primaryColor={primaryColor}
          isDarkTheme={isDarkTheme}
          onToggleTheme={() => setThemeMode((prev) => (prev === 'DARK' ? 'LIGHT' : 'DARK'))}
          onOpenLogin={handleOpenLogin}
          onOpenRegister={() => {
            if (typeof window !== 'undefined') window.history.back()
            router.push('/register')
          }}
          user={user}
          onLogout={handleLogout}
        />
      )}

      {step === 'payment' &&
        createdAppointment &&
        selectedService &&
        selectedDate &&
        selectedSlot && (
          <PaymentStep
            createdAppointment={createdAppointment}
            selectedDate={selectedDate}
            selectedSlot={selectedSlot}
            paymentAmount={paymentAmount}
            paymentError={paymentError}
            paymentLoading={paymentLoading}
            onMercadoPagoIntent={handleCreateMercadoPagoIntent}
            onBack={handleBack}
          />
        )}

      {step === 'done' && createdAppointment && (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
          <BookingDone appointment={createdAppointment} primaryColor={primaryColor} />
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
        }}
        onOpenRegister={() => {
          if (typeof window !== 'undefined') window.history.back()
          router.push('/register')
        }}
        isDarkTheme={isDarkTheme}
        storeSlug={slug || null}
      />
    </main>
  )
}
