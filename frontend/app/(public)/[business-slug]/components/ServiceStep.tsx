'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import type { Business, ServiceOption } from '../types'
import { useTypewriter } from '../hooks/useTypewriter'

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// Display order: Monday first (Lunes ... Domingo)
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

type ServiceStepProps = {
  business: Business
  selectedService: ServiceOption | null
  onSelectService: (s: ServiceOption | null) => void
  onContinue: () => void
  primaryColor: string
}

export function ServiceStep({
  business,
  selectedService,
  onSelectService,
  onContinue,
}: ServiceStepProps) {
  const workingHoursByDay = (business.workingHours ?? []).reduce(
    (acc, wh) => {
      acc[wh.dayOfWeek] = wh
      return acc
    },
    {} as Record<number, { startTime: string; endTime: string; isClosed: boolean }>
  )
  const displayName = useTypewriter(business.name)
  const [isClosing, setIsClosing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedService) setIsClosing(false)
  }, [selectedService])

  const handleCloseCart = () => {
    setIsClosing(true)
  }

  const handleSlideDownEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
    if (e.animationName === 'slide-down') {
      onSelectService(null)
      setIsClosing(false)
    }
  }

  return (
    <section className="min-h-screen text-white" style={{ backgroundColor: 'hsl(0, 0%, 9%)' }}>
      {/* Header: business name with typewriter */}
      <header className="border-b border-neutral-600 py-6">
        <div className="mx-auto max-w-6xl px-4 text-center md:text-left">
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            {displayName}
            <span className="animate-pulse">|</span>
          </h1>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 md:flex-row md:gap-12">
        {/* Left: services list */}
        <div className="flex-1 md:min-w-0">
          <h2 className="mb-4 text-center text-lg font-semibold text-neutral-300 md:text-left md:text-xl">
            Servicios
          </h2>
          <ul className="divide-y divide-neutral-600">
            {business.services.map((s) => {
              const isSelected = selectedService?.id === s.id
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => onSelectService(s)}
                    className="flex w-full items-start gap-4 py-6 pl-1 pr-4 text-left transition-colors hover:bg-neutral-700/50"
                  >
                    <span
                      className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-neutral-500"
                      aria-hidden
                    >
                      {isSelected && (
                        <span className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="text-base font-medium text-white md:text-lg">
                        {s.name}
                      </span>
                      <p className="mt-1 text-sm text-neutral-400 md:text-base">
                        {s.duration} min
                      </p>
                    </div>
                    <span className="ml-6 shrink-0 pr-2 text-base font-medium text-white md:text-lg">
                      $ {s.price.toFixed(0)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Right: employees, contact, hours — sticky, desktop only */}
        <aside className="hidden w-full shrink-0 self-start md:block md:w-72 md:sticky md:top-12">
          <div className="flex min-h-[calc(100vh-6rem)] flex-col justify-between gap-8 py-4">
            {business.employees && business.employees.length > 0 ? (
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
                  Empleados
                </h3>
                <div className="flex flex-wrap gap-3">
                  {business.employees.map((emp) => (
                    <div
                      key={emp.id}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-amber-400/20 text-lg font-medium text-amber-400">
                        {emp.photoUrl ? (
                          <Image
                            src={emp.photoUrl}
                            alt=""
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                            unoptimized
                          />
                        ) : (
                          emp.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="text-xs text-neutral-300">{emp.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div aria-hidden />
            )}

            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
                Contacto
              </h3>
              <ul className="space-y-2 text-sm text-neutral-300">
                {business.phone && (
                  <li className="flex items-center gap-2">
                    <span className="text-neutral-500" aria-hidden>
                      📞
                    </span>
                    <a
                      href={`tel:${business.phone.replace(/\s/g, '')}`}
                      className="hover:text-white"
                    >
                      {business.phone}
                    </a>
                  </li>
                )}
                {business.email && (
                  <li className="flex items-center gap-2">
                    <span className="text-neutral-500" aria-hidden>
                      ✉️
                    </span>
                    <a
                      href={`mailto:${business.email}`}
                      className="hover:text-white"
                    >
                      {business.email}
                    </a>
                  </li>
                )}
                {business.address && (
                  <li className="flex items-center gap-2">
                    <span className="text-neutral-500" aria-hidden>
                      📍
                    </span>
                    <span>{business.address}</span>
                  </li>
                )}
              </ul>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
                Horarios
              </h3>
              <ul className="space-y-2 text-sm">
                {DAY_ORDER.map((dayOfWeek) => {
                  const wh = workingHoursByDay[dayOfWeek]
                  const dayName = DAY_NAMES[dayOfWeek]
                  const value = wh?.isClosed
                    ? 'Cerrado'
                    : wh
                      ? `${wh.startTime} - ${wh.endTime}`
                      : '—'
                  return (
                    <li
                      key={dayOfWeek}
                      className="flex justify-between gap-4 text-neutral-300"
                    >
                      <span>{dayName}</span>
                      <span className="shrink-0">{value}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </aside>
      </div>

      {/* Cart bottom sheet — no overlay, side and bottom margins like reference */}
      {selectedService && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-6 md:px-10 md:pb-8"
          role="dialog"
          aria-labelledby="cart-title"
          aria-modal="true"
        >
          <div
            ref={panelRef}
            onAnimationEnd={handleSlideDownEnd}
            className={`mx-auto max-w-xl w-full rounded-2xl p-6 shadow-[0_-4px_24px_rgba(0,0,0,0.3)] ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}
            style={{ backgroundColor: 'rgb(41, 41, 41)' }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="cart-title" className="text-lg font-semibold text-white">
                Tu carrito
              </h2>
              <button
                type="button"
                onClick={handleCloseCart}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-500 text-neutral-400 transition-colors hover:bg-neutral-600 hover:text-white"
                aria-label="Cerrar"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>
            <div className="mb-4 flex items-center justify-between py-2">
              <span className="text-white">{selectedService.name}</span>
              <span className="font-medium text-white">
                $ {selectedService.price.toFixed(0)}
              </span>
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={onContinue}
                className="flex w-1/2 min-w-0 items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 font-medium text-black transition-opacity hover:opacity-90"
              >
                Continuar
                <span aria-hidden>
                  →
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
