'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { api } from '@/lib/api'
import type { Business, Step, ServiceOption, CreatedAppointment } from './types'
import { formatDateKey, getNowInArgentina } from './utils'
import {
  BookingHero,
  BookingDone,
  ClientFormStep,
  DateStep,
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
  const [clientPhone, setClientPhone] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [createdAppointment, setCreatedAppointment] = useState<CreatedAppointment | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<number | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paymentProvider, setPaymentProvider] = useState<'STRIPE' | 'MERCADOPAGO' | null>(null)
  const [themeMode, setThemeMode] = useState<ThemeMode>('DARK')

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

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.history.replaceState({ step }, '', pathname ?? `/${slug}`)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- only set initial history entry once

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onPopState = (e: PopStateEvent) => {
      setStep(e.state?.step ?? 'hero')
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

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
    setSubmitLoading(true)
    setSubmitError(null)
    api
      .post<CreatedAppointment>('/appointments', {
        businessSlug: slug,
        serviceId: selectedService.id,
        date: selectedDate,
        slotTime: selectedSlot,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        employeeId: selectedEmployeeId,
      })
      .then((res) => {
        setCreatedAppointment(res.data)
        if (business.settings?.paymentRequired) {
          goToStep('payment')
          setPaymentError(null)
          setPaymentProvider(null)
          setPaymentClientSecret(null)
          setPaymentIntentId(null)
          setPaymentAmount(null)
        } else {
          goToStep('done')
        }
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

  const handleCreateStripeIntent = () => {
    if (!createdAppointment) return
    setPaymentLoading(true)
    setPaymentError(null)
    setPaymentProvider('STRIPE')
    api
      .post<{ clientSecret: string; paymentIntentId: string; amount: number; provider: string }>(
        '/payments/create-intent',
        { appointmentId: createdAppointment.id, provider: 'STRIPE' }
      )
      .then((res) => {
        setPaymentClientSecret(res.data.clientSecret)
        setPaymentIntentId(res.data.paymentIntentId)
        setPaymentAmount(res.data.amount)
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
        setPaymentProvider(null)
      })
      .finally(() => setPaymentLoading(false))
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

  const handleStripePaymentSuccess = () => {
    goToStep('done')
    setPaymentClientSecret(null)
    setPaymentIntentId(null)
    setPaymentProvider(null)
  }

  const primaryColor = business?.primaryColor || '#f5f5f5'
  const { dateKey: todayKey, timeStr: currentTimeArgentina } = getNowInArgentina()

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

  if (step === 'done' && createdAppointment) {
    return <BookingDone appointment={createdAppointment} primaryColor={primaryColor} />
  }

  return (
    <main
      className={
        step === 'hero'
          ? 'min-h-screen h-screen overflow-hidden bg-neutral-100 transition-colors duration-300 ease-out'
          : 'min-h-screen bg-neutral-100 transition-colors duration-300 ease-out'
      }
      style={
        step === 'service' || step === 'date'
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
          primaryColor={primaryColor}
          isDarkTheme={isDarkTheme}
          onToggleTheme={() => setThemeMode((prev) => (prev === 'DARK' ? 'LIGHT' : 'DARK'))}
        />
      )}

      {step === 'date' && selectedService && (
        <DateStep
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
          slotsLoading={slotsLoading}
          selectedSlot={selectedSlot}
          onSelectedSlot={(slot, employeeId) => {
            setSelectedSlot(slot)
            setSelectedEmployeeId(employeeId)
          }}
          onContinue={() => goToStep('form')}
          onBack={handleBack}
          primaryColor={primaryColor}
          isDarkTheme={isDarkTheme}
        />
      )}

      {step === 'form' && selectedService && selectedDate && selectedSlot && (
        <ClientFormStep
          selectedService={selectedService}
          selectedDate={selectedDate}
          selectedSlot={selectedSlot}
          clientName={clientName}
          clientPhone={clientPhone}
          onClientName={setClientName}
          onClientPhone={setClientPhone}
          onSubmit={handleSubmit}
          submitLoading={submitLoading}
          submitError={submitError}
          createdAppointment={createdAppointment}
          onContinueToPayment={createdAppointment ? () => goToStep('payment') : undefined}
          onBack={handleBack}
          onBackToCalendar={
            createdAppointment
              ? () => {
                  setCreatedAppointment(null)
                  goToStep('date')
                }
              : undefined
          }
          primaryColor={primaryColor}
          isDarkTheme={isDarkTheme}
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
            paymentClientSecret={paymentClientSecret}
            paymentIntentId={paymentIntentId}
            paymentLoading={paymentLoading}
            onStripeIntent={handleCreateStripeIntent}
            onMercadoPagoIntent={handleCreateMercadoPagoIntent}
            onStripeSuccess={handleStripePaymentSuccess}
            onPaymentError={setPaymentError}
            onBack={handleBack}
            primaryColor={primaryColor}
          />
        )}
    </main>
  )
}
