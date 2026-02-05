'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { Business, Step, ServiceOption, CreatedAppointment } from './types'
import { formatDateKey } from './utils'
import {
  BookingHero,
  BookingDone,
  ClientFormStep,
  DateStep,
  PaymentStep,
  ServiceStep,
} from './components'

function isTechnicalError(msg: unknown): boolean {
  return typeof msg === 'string' && /prisma|invocation|column|database|ECONNREFUSED/i.test(msg)
}

export default function BusinessBookingPage({
  params,
}: {
  params: { 'business-slug': string }
}) {
  const slug = params['business-slug']
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [step, setStep] = useState<Step>('hero')
  const [selectedService, setSelectedService] = useState<ServiceOption | null>(null)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [weekAvailability, setWeekAvailability] = useState<Record<string, boolean>>({})
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slots, setSlots] = useState<string[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
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

  useEffect(() => {
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

  // Dark background for service and date steps so overscroll/scroll edges don't show white
  useEffect(() => {
    if (step !== 'service' && step !== 'date') return
    const prevHtml = document.documentElement.style.backgroundColor
    const prevBody = document.body.style.backgroundColor
    document.documentElement.style.backgroundColor = 'hsl(0, 0%, 9%)'
    document.body.style.backgroundColor = 'hsl(0, 0%, 9%)'
    return () => {
      document.documentElement.style.backgroundColor = prevHtml
      document.body.style.backgroundColor = prevBody
    }
  }, [step])

  useEffect(() => {
    if (step !== 'date' || !business || !selectedService) return
    const startStr = formatDateKey(calendarMonth)
    api
      .get<{ week: { date: string; hasSlots: boolean }[] }>('/availability/week', {
        params: { businessSlug: slug, serviceId: selectedService.id, startDate: startStr },
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
    setSlotsLoading(true)
    api
      .get<{ slots: string[] }>('/availability', {
        params: { businessSlug: slug, serviceId: selectedService.id, date: selectedDate },
      })
      .then((res) => {
        setSlots(res.data.slots)
        setSelectedSlot(null)
      })
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false))
  }, [selectedDate, selectedService, slug])

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
      })
      .then((res) => {
        setCreatedAppointment(res.data)
        if (business.settings?.paymentRequired) {
          setStep('payment')
          setPaymentError(null)
          setPaymentProvider(null)
          setPaymentClientSecret(null)
          setPaymentIntentId(null)
          setPaymentAmount(null)
        } else {
          setStep('done')
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
    setStep('done')
    setPaymentClientSecret(null)
    setPaymentIntentId(null)
    setPaymentProvider(null)
  }

  const primaryColor = business?.primaryColor || '#000000'
  const todayKey = formatDateKey(new Date())

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
          ? 'min-h-screen h-screen overflow-hidden bg-neutral-100'
          : 'min-h-screen bg-neutral-100'
      }
      style={step === 'service' || step === 'date' ? { backgroundColor: 'hsl(0, 0%, 9%)' } : undefined}
    >
      {step === 'hero' && (
        <BookingHero
          name={business.name}
          coverPhoto={business.coverPhoto}
          coverVideo={business.coverVideo ?? null}
          primaryColor={primaryColor}
          onReservar={() => setStep('service')}
        />
      )}

      {step === 'service' && (
        <ServiceStep
          business={business}
          selectedService={selectedService}
          onSelectService={setSelectedService}
          onContinue={() => setStep('date')}
          primaryColor={primaryColor}
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
          slots={slots}
          slotsLoading={slotsLoading}
          selectedSlot={selectedSlot}
          onSelectedSlot={setSelectedSlot}
          onContinue={() => setStep('form')}
          onBack={() => setStep('service')}
          primaryColor={primaryColor}
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
          primaryColor={primaryColor}
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
            primaryColor={primaryColor}
          />
        )}
    </main>
  )
}
