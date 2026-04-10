'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import type { AuthUser } from '@/lib/auth'
import type { Business, ServiceOption } from '../types'
import { BookingLayout } from './BookingLayout'
import { BookingStepper } from './BookingStepper'
import { ServiceAboutModal } from './ServiceAboutModal'
// Confirm flow now happens inside ServiceAboutModal when enabled.

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// Display order: Monday first (Lunes ... Domingo)
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

type ServiceStepProps = {
  business: Business
  selectedService: ServiceOption | null
  onSelectService: (s: ServiceOption | null) => void
  onContinue: () => void
  onGoToServices: () => void
  showPaymentStep?: boolean
  primaryColor: string
  pageBackgroundColor: string
  isDarkTheme?: boolean
  onToggleTheme?: () => void
  onOpenLogin?: () => void
  onOpenRegister?: () => void
  user?: AuthUser | null
  onLogout?: () => void
}

export function ServiceStep({
  business,
  selectedService,
  onSelectService,
  onContinue,
  onGoToServices,
  showPaymentStep = false,
  primaryColor,
  pageBackgroundColor,
  isDarkTheme = true,
  onToggleTheme,
  onOpenLogin,
  onOpenRegister,
  user = null,
  onLogout,
}: ServiceStepProps) {
  const truncateWords = (text: string, maxWords: number) => {
    const cleaned = (text ?? '').trim().replace(/\s+/g, ' ')
    if (!cleaned) return ''
    const words = cleaned.split(' ')
    if (words.length <= maxWords) return cleaned
    return `${words.slice(0, maxWords).join(' ')}…`
  }

  const titleColor = 'text-[color:var(--booking-fg-heading)]'
  const serviceNameColor = 'text-[color:var(--booking-fg)]'
  const serviceMetaColor = 'text-[color:var(--booking-fg-muted)]'
  const serviceRowHover = 'hover:bg-[color:var(--booking-row-hover)]'
  const bulletBorder = 'border-[color:var(--booking-bullet-border)]'
  const bulletFill = 'bg-[color:var(--booking-bullet-fill)]'
  const asideHeadingColor = 'text-[color:var(--booking-fg-heading)]'
  const asideTextColor = 'text-[color:var(--booking-fg-muted)]'
  const asideIconColor = 'text-[color:var(--booking-fg-subtle)]'
  const asideLinkHover = 'hover:text-[color:var(--booking-link-hover)]'

  const cartPanelClass =
    'border-[color:var(--booking-cart-border)] shadow-[var(--booking-cart-shadow)]'
  const cartTitleColor = 'text-[color:var(--booking-fg)]'
  const cartTextColor = 'text-[color:var(--booking-fg-muted)]'
  const cartCloseClass =
    'border-[color:var(--booking-cart-close-border)] text-[color:var(--booking-cart-close-text)] hover:bg-[color:var(--booking-row-hover)] hover:text-[color:var(--booking-fg)]'
  const cartCtaClass =
    'bg-[color:var(--booking-cart-cta-bg)] text-[color:var(--booking-cart-cta-text)] hover:bg-[color:var(--booking-cart-cta-hover)]'

  const verMasBtnClass =
    'inline-flex h-5 items-center rounded-full border border-[color:var(--booking-vermas-border)] bg-[color:var(--booking-vermas-bg)] px-2 text-[10px] font-medium leading-none text-[color:var(--booking-vermas-text)] transition-colors hover:opacity-90'

  const [openServiceSubListId, setOpenServiceSubListId] = useState<string | null>(null)
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [aboutTarget, setAboutTarget] = useState<{
      title: string
      images: string[]
      shortDescription?: string | null
      description?: string | null
    } | null>(null)

  const workingHoursByDay = (business.workingHours ?? []).reduce(
    (acc, wh) => {
      acc[wh.dayOfWeek] = wh
      return acc
    },
    {} as Record<number, { startTime: string; endTime: string; isClosed: boolean }>
  )
  const [isClosing, setIsClosing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const mustConfirmBeforeCalendar = !!business.settings?.showServiceConfirmModal

  useEffect(() => {
    if (selectedService) setIsClosing(false)
  }, [selectedService])

  // Keep the "active" marker aligned with the last real selection
  // unless the user is currently browsing a parent service with subservices.
  useEffect(() => {
    if (!selectedService) return
    const parentId = selectedService.parentServiceId ?? null
    const activeId = parentId ?? selectedService.id
    setActiveServiceId(activeId)

    // Ensure subservice panels reflect the current selection:
    // - Selecting a leaf service closes any open subservice lists.
    // - Selecting a subservice keeps its parent list open.
    setOpenServiceSubListId(parentId)
  }, [selectedService])

  const openAboutForSelection = (sel: ServiceOption) => {
    if (sel.parentServiceId) {
      const parent = business.services.find((x) => x.id === sel.parentServiceId) ?? null
      const sub = parent?.subServices?.find((x) => x.id === sel.id) ?? null
      setAboutTarget({
        title: sub?.name ?? sel.name,
        images: sub?.images ?? [],
        shortDescription: sub?.shortDescription ?? null,
        description: sub?.description ?? null,
      })
    } else {
      const svc = business.services.find((x) => x.id === sel.id) ?? null
      setAboutTarget({
        title: svc?.name ?? sel.name,
        images: svc?.images ?? [],
        shortDescription: svc?.shortDescription ?? null,
        description: svc?.description ?? null,
      })
    }
    setAboutOpen(true)
  }

  const handleAboutConfirm = () => {
    if (mustConfirmBeforeCalendar) {
      setAboutOpen(false)
      onContinue()
      return
    }
    // Modo no obligatorio: el modal "Acerca" solo es informativo.
    // Se cierra y el usuario continúa usando el botón "Continuar" del carrito.
    setAboutOpen(false)
  }

  const handleCartContinue = () => {
    if (!selectedService) return
    if (!mustConfirmBeforeCalendar) {
      onContinue()
      return
    }
    // When confirmation is required, force the user to see/confirm the selected
    // service/subservice details in the modal before proceeding to the calendar.
    openAboutForSelection(selectedService)
  }

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
      logo={business.logo}
      isDarkTheme={isDarkTheme}
      pageBackgroundColor={pageBackgroundColor}
      fontFamily={business.settings?.fontFamily ?? 'ROBOTO'}
      onToggleTheme={onToggleTheme}
      onGoToServices={onGoToServices}
      onOpenLogin={onOpenLogin}
      onOpenRegister={onOpenRegister}
      user={user}
      onLogout={onLogout}
    >
      <ServiceAboutModal
        open={aboutOpen}
        title={aboutTarget?.title ?? ''}
        images={aboutTarget?.images ?? []}
        shortDescription={aboutTarget?.shortDescription ?? null}
        description={aboutTarget?.description ?? null}
        pageBackgroundColor={pageBackgroundColor}
        isDarkTheme={isDarkTheme}
        primaryColor={primaryColor}
        showConfirmButton={mustConfirmBeforeCalendar}
        onClose={() => {
          setAboutOpen(false)
          setAboutTarget(null)
        }}
        onConfirm={handleAboutConfirm}
      />
      <BookingStepper step="service" showPaymentStep={showPaymentStep} />
      <div className="flex max-w-4xl flex-col gap-8 md:max-w-4xl md:flex-row md:gap-10 lg:max-w-6xl lg:gap-12">
        {/* Left: services list */}
        <div className="min-w-0 flex-1">
          <h2 className={`mb-4 text-center text-lg font-semibold md:mb-5 md:text-left md:text-xl ${titleColor}`}>
            Servicios
          </h2>
          <ul className="divide-y divide-[color:var(--booking-divide)]">
            {business.services.map((s) => {
              const subServices = s.subServices ?? []
              const hasSubServices = subServices.length > 0
              const serviceSelected = !!selectedService && selectedService.parentServiceId === s.id
              const directSelected = selectedService?.id === s.id && !selectedService?.parentServiceId
              const isSubListOpen = openServiceSubListId === s.id
              const isActiveParent = activeServiceId === s.id
              const serviceShort = s.shortDescription?.trim() || ''
              const serviceLong = s.description?.trim() || ''
              const serviceHasMoreDetails =
                (Array.isArray(s.images) && s.images.length > 0) || !!serviceLong
              const serviceShortTruncated = truncateWords(serviceShort, 6)

              return (
                <li key={s.id} className="py-1">
                  {/* Parent service row */}
                  <button
                    type="button"
                    onClick={() => {
                      if (hasSubServices) {
                        // Toggle: clicking the parent again closes its subservice list.
                        setActiveServiceId(s.id)
                        setOpenServiceSubListId((prev) => (prev === s.id ? null : s.id))
                        // When opening a parent list, clear any previous leaf selection so
                        // the UI doesn't imply a final choice until the user picks a subservice.
                        if (openServiceSubListId !== s.id) onSelectService(null)
                      } else {
                        // Selecting a leaf service: close any open sublists and mark it active.
                        setOpenServiceSubListId(null)
                        setActiveServiceId(s.id)
                        onSelectService({
                          id: s.id,
                          name: s.name,
                          price: s.price,
                          duration: s.duration,
                        })
                      }
                    }}
                    className={`flex w-full items-start gap-4 py-4 pl-1 pr-4 text-left transition-colors md:py-5 md:gap-5 ${serviceRowHover}`}
                  >
                    <span
                      className={`mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${bulletBorder}`}
                      aria-hidden
                    >
                      {(directSelected || serviceSelected || (hasSubServices && isSubListOpen) || isActiveParent) && (
                        <span className={`h-2 w-2 rounded-full ${bulletFill}`} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className={`min-w-0 truncate text-base font-medium md:text-lg ${serviceNameColor}`}>
                          {s.name}
                        </span>
                      </div>
                      {/* If the service has subservices, we don't show duration/price here */}
                      {!hasSubServices && (
                        <p className={`mt-1 text-sm md:text-base ${serviceMetaColor}`}>
                          {s.duration} min
                        </p>
                      )}
                      {(serviceShort || serviceHasMoreDetails) && (
                        <div className={`mt-2 text-xs md:text-sm ${serviceMetaColor}`}>
                          {serviceShort ? (
                            <span className="min-w-0" title={serviceShort}>
                              {serviceShortTruncated}
                              {serviceHasMoreDetails && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const sel: ServiceOption = {
                                      id: s.id,
                                      name: s.name,
                                      price: s.price,
                                      duration: s.duration,
                                    }
                                    onSelectService(sel)
                                    openAboutForSelection(sel)
                                  }}
                                  className={`${verMasBtnClass} ml-2 align-middle`}
                                  aria-label={`Ver más sobre ${s.name}`}
                                >
                                  Ver más
                                </button>
                              )}
                            </span>
                          ) : serviceHasMoreDetails ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                const sel: ServiceOption = {
                                  id: s.id,
                                  name: s.name,
                                  price: s.price,
                                  duration: s.duration,
                                }
                                onSelectService(sel)
                                openAboutForSelection(sel)
                              }}
                              className={verMasBtnClass}
                              aria-label={`Ver más sobre ${s.name}`}
                            >
                              Ver más
                            </button>
                          ) : null}
                        </div>
                      )}
                    </div>
                    {!hasSubServices && (
                      <span
                        className={`ml-6 shrink-0 pr-2 text-base font-medium md:text-lg ${serviceNameColor}`}
                      >
                        $ {s.price.toFixed(0)}
                      </span>
                    )}
                    {hasSubServices && (
                      <span
                        className={`ml-4 mt-0.5 shrink-0 text-sm ${serviceMetaColor} transition-transform duration-200 ${
                          isSubListOpen ? 'rotate-180' : 'rotate-0'
                        }`}
                        aria-hidden
                      >
                        ▼
                      </span>
                    )}
                  </button>

                  {/* Subservices list */}
                  {hasSubServices && (
                    <div
                      className={`ml-8 overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
                        isSubListOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <ul className="mt-1 space-y-1 pb-1">
                        {subServices.map((sub) => {
                          const subShort = sub.shortDescription?.trim() || ''
                          const subLong = sub.description?.trim() || ''
                          const subHasMoreDetails =
                            (Array.isArray(sub.images) && sub.images.length > 0) || !!subLong
                          const subShortTruncated = truncateWords(subShort, 6)
                          const isSelected =
                            selectedService?.id === sub.id &&
                            selectedService?.parentServiceId === s.id
                          return (
                            <li key={sub.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  const sel: ServiceOption = {
                                    id: sub.id,
                                    name: `${s.name} - ${sub.name}`,
                                    price: sub.price,
                                    duration: sub.duration,
                                    parentServiceId: s.id,
                                    parentServiceName: s.name,
                                  }
                                  setOpenServiceSubListId(s.id)
                                  setActiveServiceId(s.id)
                                  onSelectService(sel)
                                }}
                                className={`flex w-full items-start gap-3 py-2 pr-4 text-left text-sm md:text-base ${serviceRowHover}`}
                              >
                                <span
                                  className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${bulletBorder}`}
                                  aria-hidden
                                >
                                  {isSelected && (
                                    <span className={`h-1.5 w-1.5 rounded-full ${bulletFill}`} />
                                  )}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex min-w-0 items-center gap-2">
                                    <span className={`min-w-0 truncate ${serviceNameColor}`}>{sub.name}</span>
                                  </div>
                                  <p className={`mt-0.5 text-xs md:text-sm ${serviceMetaColor}`}>
                                    {sub.duration} min
                                  </p>
                                  {(subShort || subHasMoreDetails) && (
                                    <div className={`mt-1 text-[11px] md:text-xs ${serviceMetaColor}`}>
                                      {subShort ? (
                                        <span className="min-w-0" title={subShort}>
                                          {subShortTruncated}
                                          {subHasMoreDetails && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                const sel: ServiceOption = {
                                                  id: sub.id,
                                                  name: `${s.name} - ${sub.name}`,
                                                  price: sub.price,
                                                  duration: sub.duration,
                                                  parentServiceId: s.id,
                                                  parentServiceName: s.name,
                                                }
                                                setOpenServiceSubListId(s.id)
                                                setActiveServiceId(s.id)
                                                onSelectService(sel)
                                                openAboutForSelection(sel)
                                              }}
                                              className={`${verMasBtnClass} ml-2 align-middle`}
                                              aria-label={`Ver más sobre ${sub.name}`}
                                            >
                                              Ver más
                                            </button>
                                          )}
                                        </span>
                                      ) : subHasMoreDetails ? (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            const sel: ServiceOption = {
                                              id: sub.id,
                                              name: `${s.name} - ${sub.name}`,
                                              price: sub.price,
                                              duration: sub.duration,
                                              parentServiceId: s.id,
                                              parentServiceName: s.name,
                                            }
                                            setOpenServiceSubListId(s.id)
                                            setActiveServiceId(s.id)
                                            onSelectService(sel)
                                            openAboutForSelection(sel)
                                          }}
                                          className={verMasBtnClass}
                                          aria-label={`Ver más sobre ${sub.name}`}
                                        >
                                          Ver más
                                        </button>
                                      ) : null}
                                    </div>
                                  )}
                                </div>
                                <span
                                  className={`ml-4 shrink-0 pr-1 text-sm font-medium md:text-base ${serviceNameColor}`}
                                >
                                  $ {sub.price.toFixed(0)}
                                </span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
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
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[color:var(--booking-avatar-bg)] text-lg font-medium text-[color:var(--booking-avatar-text)]">
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
      {selectedService && !aboutOpen && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 md:px-6 md:pb-8 lg:px-10"
          role="dialog"
          aria-labelledby="cart-title"
          aria-modal="true"
        >
          <div
            ref={panelRef}
            onAnimationEnd={handleSlideDownEnd}
            className={`mx-auto w-full max-w-lg rounded-2xl border bg-[color:var(--booking-cart-bg)] p-6 transition-colors duration-300 ease-out md:max-w-xl md:p-7 ${cartPanelClass} ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}
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
            <div className="mb-5 flex items-start justify-between gap-3 py-2">
              <span className={`min-w-0 flex-1 text-lg ${cartTextColor}`}>{selectedService.name}</span>
              <span className={`shrink-0 whitespace-nowrap text-lg font-semibold ${cartTextColor}`}>
                $ {selectedService.price.toFixed(0)}
              </span>
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleCartContinue}
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
