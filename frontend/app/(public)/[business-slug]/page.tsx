'use client'

import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { api } from '@/lib/api'

type Business = {
  id: string
  name: string
  slug: string
  description: string | null
  primaryColor: string
  services: { id: string; name: string; price: number; duration: number }[]
  workingHours: { dayOfWeek: number; startTime: string; endTime: string; isClosed: boolean }[]
  settings: { paymentRequired: boolean; paymentType: string | null; depositPercentage: number | null } | null
}

type Step = 'hero' | 'service' | 'date' | 'time' | 'form' | 'payment' | 'done'

function formatDateKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

function getMonthStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function getMonthEnd(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

function StripePaymentForm({
  appointmentId,
  paymentIntentId,
  onSuccess,
  onError,
  primaryColor,
}: {
  appointmentId: string
  paymentIntentId: string
  onSuccess: () => void
  onError: (msg: string) => void
  primaryColor: string
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    onError('')
    try {
      const returnUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/booking/stripe-return?appointmentId=${appointmentId}&paymentIntentId=${encodeURIComponent(paymentIntentId)}`
          : ''
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
          receipt_email: undefined,
        },
      })
      if (error) {
        onError(error.message || 'Error al procesar el pago')
        setLoading(false)
        return
      }
      await api.post('/payments/confirm', { appointmentId, paymentIntentId })
      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al confirmar el pago'
      const isTechnical = /prisma|invocation|column|database|ECONNREFUSED/i.test(msg)
      onError(isTechnical ? 'No se pudo confirmar el pago. Por favor intentá de nuevo.' : msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-3 rounded-lg font-medium text-white disabled:opacity-50"
        style={{ backgroundColor: primaryColor }}
      >
        {loading ? 'Procesando...' : 'Pagar'}
      </button>
    </form>
  )
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
  const [selectedService, setSelectedService] = useState<{ id: string; name: string; price: number; duration: number } | null>(null)
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
  const [createdAppointment, setCreatedAppointment] = useState<{
    id: string
    startTime: string
    endTime: string
    serviceName: string
    cancellationToken: string | null
  } | null>(null)
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

  useEffect(() => {
    if (step !== 'date' || !business || !selectedService) return
    const monthStart = getMonthStart(calendarMonth)
    const monthEnd = getMonthEnd(calendarMonth)
    const map: Record<string, boolean> = {}
    const fetchWeek = (start: Date) => {
      const startStr = formatDateKey(start)
      return api
        .get<{ week: { date: string; hasSlots: boolean }[] }>('/availability/week', {
          params: { businessSlug: slug, serviceId: selectedService.id, startDate: startStr },
        })
        .then((res) => {
          res.data.week.forEach((w) => { map[w.date] = w.hasSlots })
        })
    }
    const start1 = new Date(monthStart)
    const start2 = new Date(monthStart.getFullYear(), monthStart.getMonth(), monthStart.getDate() + 7)
    const start3 = new Date(monthStart.getFullYear(), monthStart.getMonth(), monthStart.getDate() + 14)
    const start4 = new Date(monthStart.getFullYear(), monthStart.getMonth(), monthStart.getDate() + 21)
    Promise.all([fetchWeek(start1), fetchWeek(start2), fetchWeek(start3), fetchWeek(start4)])
      .then(() => setWeekAvailability({ ...map }))
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
      .post<{ id: string; startTime: string; endTime: string; serviceName: string; cancellationToken: string | null }>(
        '/appointments',
        {
          businessSlug: slug,
          serviceId: selectedService.id,
          date: selectedDate,
          slotTime: selectedSlot,
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
        }
      )
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
        const isTechnical = typeof msg === 'string' && /prisma|invocation|column|database|ECONNREFUSED/i.test(msg)
        setSubmitError(
          isServerError || isTechnical
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
        const isTechnical = typeof msg === 'string' && /prisma|invocation|column|database|ECONNREFUSED/i.test(msg)
        setPaymentError(
          isServerError || isTechnical
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
        const isTechnical = typeof msg === 'string' && /prisma|invocation|column|database|ECONNREFUSED/i.test(msg)
        setPaymentError(
          isServerError || isTechnical
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
    const cancelUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/cancel?token=${createdAppointment.cancellationToken}`
      : '#'
    return (
      <main className="min-h-screen bg-neutral-100 py-12 px-4">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow p-6 text-center">
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Cita confirmada</h2>
          <p className="text-neutral-600 mb-1">{createdAppointment.serviceName}</p>
          <p className="text-neutral-600 text-sm">
            {new Date(createdAppointment.startTime).toLocaleString('es')} –{' '}
            {new Date(createdAppointment.endTime).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
          </p>
          {createdAppointment.cancellationToken && (
            <p className="mt-4 text-sm text-neutral-500">
              Para cancelar, usa este enlace:{' '}
              <a href={cancelUrl} className="underline" style={{ color: primaryColor }}>
                Cancelar cita
              </a>
            </p>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-100">
      {step === 'hero' && (
        <section
          className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center"
          style={{ backgroundColor: primaryColor, color: '#fff' }}
        >
          <h1 className="text-3xl font-bold">{business.name}</h1>
          {business.description && (
            <p className="mt-4 max-w-md text-white/90">{business.description}</p>
          )}
          <button
            type="button"
            onClick={() => setStep('service')}
            className="mt-8 px-8 py-3 rounded-lg font-medium bg-white text-neutral-900 hover:bg-neutral-100"
          >
            Reservar turno
          </button>
        </section>
      )}

      {step === 'service' && (
        <section className="py-12 px-4 max-w-lg mx-auto">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Elegí el servicio</h2>
          <ul className="space-y-2">
            {business.services.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setSelectedService(s)}
                  className="w-full flex justify-between items-center p-4 rounded-lg border border-neutral-200 hover:border-neutral-400 text-left"
                >
                  <span>{s.name}</span>
                  <span className="font-medium">{s.price.toFixed(2)} · {s.duration} min</span>
                </button>
              </li>
            ))}
          </ul>
          {selectedService && (
            <div className="mt-6 flex justify-between items-center">
              <span className="text-neutral-600">{selectedService.name} · {selectedService.price.toFixed(2)}</span>
              <button
                type="button"
                onClick={() => setStep('date')}
                className="px-4 py-2 rounded-lg font-medium text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Continuar
              </button>
            </div>
          )}
        </section>
      )}

      {step === 'date' && selectedService && (
        <section className="py-12 px-4 max-w-lg mx-auto">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Elegí la fecha</h2>
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1))}
              className="p-2 rounded hover:bg-neutral-200"
            >
              ←
            </button>
            <span className="font-medium">
              {calendarMonth.toLocaleString('es', { month: 'long', year: 'numeric' })}
            </span>
            <button
              type="button"
              onClick={() => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1))}
              className="p-2 rounded hover:bg-neutral-200"
            >
              →
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d) => (
              <div key={d} className="py-1 text-neutral-500 font-medium">{d}</div>
            ))}
            {(() => {
              const start = getMonthStart(calendarMonth)
              const end = getMonthEnd(calendarMonth)
              const firstDay = start.getDay()
              const days: (Date | null)[] = Array(firstDay).fill(null)
              for (let i = 1; i <= end.getDate(); i++) {
                days.push(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), i))
              }
              return days.map((d, i) => {
                if (!d) return <div key={`empty-${i}`} />
                const key = formatDateKey(d)
                const isPast = key < todayKey
                const hasSlots = weekAvailability[key] === true
                const isSelected = selectedDate === key
                const canSelect = !isPast && hasSlots
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!canSelect}
                    onClick={() => canSelect && setSelectedDate(key)}
                    className={`py-2 rounded ${!canSelect ? 'text-neutral-300 cursor-not-allowed' : isSelected ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-200'}`}
                  >
                    {d.getDate()}
                  </button>
                )
              })
            })()}
          </div>
          {selectedDate && (
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setStep('time')}
                className="px-4 py-2 rounded-lg font-medium text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Continuar
              </button>
            </div>
          )}
        </section>
      )}

      {step === 'time' && selectedService && selectedDate && (
        <section className="py-12 px-4 max-w-lg mx-auto">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Elegí el horario</h2>
          {slotsLoading ? (
            <p className="text-neutral-500">Cargando horarios...</p>
          ) : slots.length === 0 ? (
            <p className="text-neutral-500">No hay horarios disponibles</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedSlot(s)}
                  className={`py-2 rounded-lg border ${selectedSlot === s ? 'border-2 text-white' : 'border-neutral-200 hover:border-neutral-400'}`}
                  style={selectedSlot === s ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {selectedSlot && (
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="px-4 py-2 rounded-lg font-medium text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Continuar
              </button>
            </div>
          )}
        </section>
      )}

      {step === 'form' && selectedService && selectedDate && selectedSlot && (
        <section className="py-12 px-4 max-w-lg mx-auto">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Tus datos</h2>
          <p className="text-sm text-neutral-500 mb-4">
            {selectedService.name} · {selectedDate} at {selectedSlot}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="clientName" className="block text-sm font-medium text-neutral-700 mb-1">
                Nombre completo
              </label>
              <input
                id="clientName"
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-offset-0"
                style={{ ['--tw-ring-color' as string]: primaryColor }}
              />
            </div>
            <div>
              <label htmlFor="clientPhone" className="block text-sm font-medium text-neutral-700 mb-1">
                Teléfono
              </label>
              <input
                id="clientPhone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                required
                value={clientPhone}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d+]/g, '')
                  const hasLeadingPlus = raw.startsWith('+')
                  const digitsOnly = raw.replace(/\+/g, '')
                  setClientPhone(hasLeadingPlus ? `+${digitsOnly}` : digitsOnly)
                }}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-offset-0"
                placeholder="+54 11 12345678"
              />
            </div>
            <p className="text-xs text-neutral-500">
              Estos datos son obligatorios para la confirmación, recordatorios y el enlace para cancelar.
            </p>
            {submitError && <p className="text-sm text-red-600">{submitError}</p>}
            <button
              type="submit"
              disabled={submitLoading}
              className="w-full py-3 rounded-lg font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {submitLoading ? 'Reservando...' : 'Confirmar reserva'}
            </button>
          </form>
        </section>
      )}

      {step === 'payment' && createdAppointment && selectedService && selectedDate && selectedSlot && (
        <section className="py-12 px-4 max-w-lg mx-auto">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Pago</h2>
          <p className="text-sm text-neutral-600 mb-2">
            {createdAppointment.serviceName} · {selectedDate} · {selectedSlot}
          </p>
          {paymentAmount != null && (
            <p className="text-sm font-medium text-neutral-700 mb-4">
              Monto a pagar: {paymentAmount.toFixed(2)}
            </p>
          )}
          {paymentError && <p className="text-sm text-red-600 mb-4">{paymentError}</p>}

          {!paymentClientSecret ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleCreateStripeIntent}
                disabled={paymentLoading}
                className="w-full py-3 rounded-lg font-medium border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50"
              >
                {paymentLoading ? 'Cargando...' : 'Pagar con tarjeta (Stripe)'}
              </button>
              <button
                type="button"
                onClick={handleCreateMercadoPagoIntent}
                disabled={paymentLoading}
                className="w-full py-3 rounded-lg font-medium border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50"
              >
                {paymentLoading ? 'Cargando...' : 'Pagar con Mercado Pago'}
              </button>
            </div>
          ) : paymentClientSecret && paymentIntentId && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: paymentClientSecret,
                appearance: { theme: 'stripe' },
              }}
            >
              <StripePaymentForm
                appointmentId={createdAppointment.id}
                paymentIntentId={paymentIntentId}
                onSuccess={handleStripePaymentSuccess}
                onError={setPaymentError}
                primaryColor={primaryColor}
              />
            </Elements>
          )}
        </section>
      )}
    </main>
  )
}
