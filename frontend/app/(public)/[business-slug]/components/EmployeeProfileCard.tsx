'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Clock, Scissors, X } from 'lucide-react'
import type { Business, Employee } from '../types'
import { DAY_NAMES, DAY_ORDER, hoursLabel, todayDayOfWeek } from './BusinessInfoBar'

/** Where the card starts: the team card that was tapped (viewport coordinates). */
export type CardOrigin = { x: number; y: number; width: number; height: number }

type EmployeeProfileCardProps = {
  employee: Employee | null
  origin: CardOrigin | null
  business: Business
  onClose: () => void
  onBookWith: (employeeId: string) => void
}

const CARD_WIDTH = 380

/** Services (or subservices) the employee does, with price and duration. */
function servicesFor(employee: Employee, business: Business) {
  const restrictions = employee.serviceRestrictions ?? []
  const blockedServices = new Set(restrictions.map((r) => r.serviceId).filter(Boolean))
  const blockedSubServices = new Set(restrictions.map((r) => r.subServiceId).filter(Boolean))
  const out: { id: string; name: string; price: number; duration: number }[] = []
  for (const s of business.services) {
    if (blockedServices.has(s.id)) continue
    const subs = s.subServices ?? []
    if (subs.length === 0) {
      out.push({ id: s.id, name: s.name, price: s.price, duration: s.duration })
      continue
    }
    for (const sub of subs) {
      if (!blockedSubServices.has(sub.id)) {
        out.push({ id: sub.id, name: `${s.name} - ${sub.name}`, price: sub.price, duration: sub.duration })
      }
    }
  }
  return out
}

function Avatar({ employee, className }: { employee: Employee; className: string }) {
  return (
    <div
      className={`flex items-center justify-center overflow-hidden bg-[color:var(--booking-avatar-bg)] font-semibold text-[color:var(--booking-avatar-text)] ${className}`}
    >
      {employee.photoUrl ? (
        <img src={employee.photoUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        employee.name.charAt(0).toUpperCase()
      )}
    </div>
  )
}

/**
 * Professional profile. The card flies from the tapped team card to the center while flipping:
 * the front is the photo, the back is the profile (services, hours, book button).
 */
export function EmployeeProfileCard({ employee, origin, business, onClose, onBookWith }: EmployeeProfileCardProps) {
  useEffect(() => {
    if (!employee) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [employee, onClose])

  // Offset/scale that place the centered card on top of the tapped card.
  const from = (() => {
    if (!origin || typeof window === 'undefined') return { x: 0, y: 40, scale: 0.6 }
    const width = Math.min(CARD_WIDTH, window.innerWidth - 32)
    return {
      x: origin.x + origin.width / 2 - window.innerWidth / 2,
      y: origin.y + origin.height / 2 - window.innerHeight / 2,
      scale: Math.max(0.2, origin.width / width),
    }
  })()

  const today = todayDayOfWeek()
  const byDay = new Map(business.workingHours.map((wh) => [wh.dayOfWeek, wh]))
  const services = employee ? servicesFor(employee, business) : []
  const faceClass = 'col-start-1 row-start-1 [backface-visibility:hidden] [-webkit-backface-visibility:hidden]'

  return (
    <AnimatePresence>
      {employee && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          initial={{ backgroundColor: 'rgba(0,0,0,0)' }}
          animate={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
          exit={{ backgroundColor: 'rgba(0,0,0,0)' }}
          onClick={onClose}
          style={{ perspective: 1400 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="employee-profile-name"
            className="grid w-full [transform-style:preserve-3d]"
            style={{ maxWidth: CARD_WIDTH }}
            initial={{ ...from, rotateY: 0, opacity: 0.6 }}
            animate={{ x: 0, y: 0, scale: 1, rotateY: 180, opacity: 1 }}
            exit={{ ...from, rotateY: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 18, mass: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Front: the same look as the team card. */}
            <div
              className={`${faceClass} flex flex-col overflow-hidden rounded-3xl border border-[color:var(--booking-card-border)] [background:linear-gradient(var(--booking-card-bg),var(--booking-card-bg)),var(--booking-page-bg)] shadow-2xl`}
              aria-hidden
            >
              <Avatar employee={employee} className="aspect-square w-full text-7xl" />
              <p className="px-5 py-4 text-xl font-semibold text-[color:var(--booking-fg)]">{employee.name}</p>
            </div>

            {/* Back: the profile. */}
            <div
              className={`${faceClass} flex max-h-[85vh] flex-col overflow-hidden rounded-3xl border border-[color:var(--booking-card-border)] [background:linear-gradient(var(--booking-card-bg),var(--booking-card-bg)),var(--booking-page-bg)] text-[color:var(--booking-fg)] shadow-2xl [transform:rotateY(180deg)]`}
            >
              <div className="relative flex items-center gap-4 border-b border-[color:var(--booking-divide)] p-5">
                <Avatar employee={employee} className="h-16 w-16 shrink-0 rounded-2xl text-2xl" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--booking-cta-bg)]">
                    {employee.isOwner ? 'Dueño · Profesional' : 'Profesional'}
                  </p>
                  <h3 id="employee-profile-name" className="truncate text-xl font-semibold">
                    {employee.name}
                  </h3>
                  {employee.bio?.trim() && (
                    <p className="mt-0.5 text-sm text-[color:var(--booking-fg-muted)]">{employee.bio.trim()}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--booking-border)] text-[color:var(--booking-fg-muted)] hover:bg-[color:var(--booking-control-hover)]"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto p-5">
                <section>
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Scissors className="h-4 w-4 text-[color:var(--booking-cta-bg)]" aria-hidden />
                    Servicios que realiza
                  </h4>
                  {services.length === 0 ? (
                    <p className="text-sm text-[color:var(--booking-fg-muted)]">Sin servicios asignados.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {services.map((s) => (
                        <li
                          key={s.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-[color:var(--booking-border-soft)] bg-[color:var(--booking-control-bg)] px-3 py-2 text-sm"
                        >
                          <span className="min-w-0 truncate">{s.name}</span>
                          <span className="shrink-0 text-[color:var(--booking-fg-muted)]">
                            {s.duration} min · $ {s.price.toFixed(0)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {business.workingHours.length > 0 && (
                  <section>
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <Clock className="h-4 w-4 text-[color:var(--booking-cta-bg)]" aria-hidden />
                      Horario
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {DAY_ORDER.map((d) => (
                        <li
                          key={d}
                          className={`flex justify-between gap-4 rounded-lg px-3 py-1.5 ${
                            d === today
                              ? 'bg-[color:var(--booking-control-bg)] font-medium text-[color:var(--booking-fg)]'
                              : 'text-[color:var(--booking-fg-muted)]'
                          }`}
                        >
                          <span>
                            {DAY_NAMES[d]}
                            {d === today ? ' · hoy' : ''}
                          </span>
                          <span className="text-right">{hoursLabel(byDay.get(d))}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>

              <div className="border-t border-[color:var(--booking-divide)] p-4">
                <button
                  type="button"
                  onClick={() => onBookWith(employee.id)}
                  className="w-full rounded-xl bg-[color:var(--booking-cta-bg)] py-3 font-semibold text-[color:var(--booking-cta-fg)] shadow-sm transition-opacity hover:opacity-90"
                >
                  Reservar con {employee.name}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
