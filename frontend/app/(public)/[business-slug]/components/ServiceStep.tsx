'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import type { Business, ServiceOption } from '../types'
import { BookingLayout } from './BookingLayout'

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// Display order: Monday first (Lunes ... Domingo)
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

type ServiceStepProps = {
  business: Business
  selectedService: ServiceOption | null
  onSelectService: (s: ServiceOption | null) => void
  onContinue: () => void
  onGoToServices: () => void
  primaryColor: string
  isDarkTheme?: boolean
  onToggleTheme?: () => void
}

export function ServiceStep({
  business,
  selectedService,
  onSelectService,
  onContinue,
  onGoToServices,
  primaryColor,
  isDarkTheme = true,
  onToggleTheme,
}: ServiceStepProps) {
  const titleColor = isDarkTheme ? 'text-neutral-300' : 'text-neutral-800'
  const serviceNameColor = isDarkTheme ? 'text-white' : 'text-neutral-900'
  const serviceMetaColor = isDarkTheme ? 'text-neutral-400' : 'text-neutral-700'
  const serviceRowHover = isDarkTheme ? 'hover:bg-neutral-700/50' : 'hover:bg-neutral-100'
  const bulletBorder = isDarkTheme ? 'border-neutral-500' : 'border-neutral-500'
  const bulletFill = isDarkTheme ? 'bg-white' : 'bg-neutral-900'
  const asideHeadingColor = isDarkTheme ? 'text-neutral-400' : 'text-neutral-700'
  const asideTextColor = isDarkTheme ? 'text-neutral-300' : 'text-neutral-900'
  const asideIconColor = isDarkTheme ? 'text-neutral-500' : 'text-neutral-600'
  const asideLinkHover = isDarkTheme ? 'hover:text-white' : 'hover:text-neutral-900'

  // Cart behavior requested:
  // - LIGHT page: black cart with white content
  // - DARK page: keep previous dark appearance
  const cartBg = isDarkTheme ? 'rgb(41, 41, 41)' : 'rgb(236, 236, 236)'
  const cartPanelClass = isDarkTheme
    ? 'border-neutral-700 shadow-[0_-4px_24px_rgba(0,0,0,0.3)]'
    : 'border-neutral-300 shadow-[0_-4px_24px_rgba(0,0,0,0.12)]'
  const cartTitleColor = isDarkTheme ? 'text-white' : 'text-neutral-900'
  const cartTextColor = isDarkTheme ? 'text-neutral-100' : 'text-neutral-800'
  const cartCloseClass = isDarkTheme
    ? 'border-neutral-500 text-neutral-400 hover:bg-neutral-600 hover:text-white'
    : 'border-neutral-400 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-800'
  const cartCtaClass = isDarkTheme
    ? 'bg-white text-black hover:opacity-90'
    : 'border border-neutral-300 bg-white text-black hover:bg-neutral-50'
  const workingHoursByDay = (business.workingHours ?? []).reduce(
    (acc, wh) => {
      acc[wh.dayOfWeek] = wh
      return acc
    },
    {} as Record<number, { startTime: string; endTime: string; isClosed: boolean }>
  )
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
    <BookingLayout
      businessName={business.name}
      isDarkTheme={isDarkTheme}
      onToggleTheme={onToggleTheme}
      onGoToServices={onGoToServices}
    >
      <div className="flex max-w-4xl flex-col gap-8 md:max-w-4xl md:flex-row md:gap-10 lg:max-w-6xl lg:gap-12">
        {/* Left: services list */}
        <div className="min-w-0 flex-1">
          <h2 className={`mb-4 text-center text-lg font-semibold md:mb-5 md:text-left md:text-xl ${titleColor}`}>
            Servicios
          </h2>
          <ul className={`divide-y ${isDarkTheme ? 'divide-neutral-600' : 'divide-neutral-300'}`}>
            {business.services.map((s) => {
              const isSelected = selectedService?.id === s.id
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => onSelectService(s)}
                    className={`flex w-full items-start gap-4 py-5 pl-1 pr-4 text-left transition-colors md:py-6 md:gap-5 ${serviceRowHover}`}
                  >
                    <span
                      className={`mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${bulletBorder}`}
                      aria-hidden
                    >
                      {isSelected && (
                        <span className={`h-2 w-2 rounded-full ${bulletFill}`} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className={`text-base font-medium md:text-lg ${serviceNameColor}`}>
                        {s.name}
                      </span>
                      <p className={`mt-1 text-sm md:text-base ${serviceMetaColor}`}>
                        {s.duration} min
                      </p>
                    </div>
                    <span className={`ml-6 shrink-0 pr-2 text-base font-medium md:text-lg ${serviceNameColor}`}>
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
          <div className="flex flex-col gap-8 py-4 md:gap-9">
            {business.employees && business.employees.length > 0 ? (
              <div>
                <h3 className={`mb-3 text-sm font-semibold uppercase tracking-wide ${asideHeadingColor}`}>
                  Empleados
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {business.employees.map((emp) => (
                    <div
                      key={emp.id}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <div className="relative overflow-visible">
                        <div
                          className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-full text-lg font-medium ${
                            isDarkTheme ? 'bg-neutral-600 text-neutral-200' : 'bg-neutral-300 text-neutral-700'
                          }`}
                        >
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
                      </div>
                      <span className={`text-xs ${asideTextColor}`}>{emp.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div aria-hidden />
            )}

            <div>
              <h3 className={`mb-3 text-sm font-semibold uppercase tracking-wide ${asideHeadingColor}`}>
                Contacto
              </h3>
              <ul className={`space-y-2 text-sm ${asideTextColor}`}>
                {business.phone && (
                  <li className="flex items-center gap-2">
                    <span className={asideIconColor} aria-hidden>
                      📞
                    </span>
                    <a
                      href={`tel:${business.phone.replace(/\s/g, '')}`}
                      className={asideLinkHover}
                    >
                      {business.phone}
                    </a>
                  </li>
                )}
                {business.email && (
                  <li className="flex items-center gap-2">
                    <span className={asideIconColor} aria-hidden>
                      ✉️
                    </span>
                    <a
                      href={`mailto:${business.email}`}
                      className={asideLinkHover}
                    >
                      {business.email}
                    </a>
                  </li>
                )}
                {business.address && (
                  <li className="flex items-center gap-2">
                    <span className={asideIconColor} aria-hidden>
                      📍
                    </span>
                    <span>{business.address}</span>
                  </li>
                )}
              </ul>
            </div>

            <div>
              <h3 className={`mb-3 text-sm font-semibold uppercase tracking-wide ${asideHeadingColor}`}>
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
                      className={`flex justify-between gap-4 ${asideTextColor}`}
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
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 md:px-6 md:pb-8 lg:px-10"
          role="dialog"
          aria-labelledby="cart-title"
          aria-modal="true"
        >
          <div
            ref={panelRef}
            onAnimationEnd={handleSlideDownEnd}
            className={`mx-auto w-full max-w-lg rounded-2xl border p-6 transition-colors duration-300 ease-out md:max-w-xl md:p-7 ${cartPanelClass} ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}
            style={{ backgroundColor: cartBg }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="cart-title" className={`text-lg font-semibold ${cartTitleColor}`}>
                Tu carrito
              </h2>
              <button
                type="button"
                onClick={handleCloseCart}
                className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${cartCloseClass}`}
                aria-label="Cerrar"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>
            <div className="mb-5 flex items-center justify-between py-2">
              <span className={`text-lg ${cartTextColor}`}>{selectedService.name}</span>
              <span className={`text-lg font-semibold ${cartTextColor}`}>
                $ {selectedService.price.toFixed(0)}
              </span>
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={onContinue}
                className={`flex w-2/3 min-w-0 items-center justify-center gap-2 rounded-lg px-4 py-3.5 text-base font-medium transition-opacity ${cartCtaClass}`}
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
    </BookingLayout>
  )
}
