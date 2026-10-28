'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion'
import { ChevronDown, Clock, Scissors, X } from 'lucide-react'
import type { Business, Employee } from '../types'
import { servicesForEmployee, workingHoursForEmployee } from '../utils'
import { DAY_NAMES, DAY_ORDER, hoursLabel, todayDayOfWeek } from './BusinessInfoBar'

/** Where the card starts: the team card that was tapped (viewport coordinates). */
export type CardOrigin = { x: number; y: number; width: number; height: number }

type EmployeeProfileCardProps = {
  employee: Employee | null
  origin: CardOrigin | null
  business: Business
  onClose: () => void
}

const CARD_WIDTH = 380

/** Turn duration and easing; the faces swap exactly at 90° (see `frontOpacity`). */
const FLIP_TRANSITION = { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }

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
 * the front is the photo, the back is the profile (bio, services, hours).
 */
export function EmployeeProfileCard({ employee, origin, business, onClose }: EmployeeProfileCardProps) {
  const [hoursOpen, setHoursOpen] = useState(false)
  // Which face shows is driven by the angle itself, not by backface-visibility,
  // so no browser keeps painting the front once the card has turned.
  const rotateY = useMotionValue(0)
  const frontOpacity = useTransform(rotateY, (deg) => (deg < 90 ? 1 : 0))
  const backOpacity = useTransform(rotateY, (deg) => (deg < 90 ? 0 : 1))

  useEffect(() => {
    if (!employee) return
    setHoursOpen(false)
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
  const hours = workingHoursForEmployee(business, employee)
  const byDay = new Map(hours.map((wh) => [wh.dayOfWeek, wh]))
  const serviceNames = employee ? servicesForEmployee(business.services, employee).map((s) => s.name) : []
  const faceClass = 'col-start-1 row-start-1'

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
            className="grid w-full"
            style={{ maxWidth: CARD_WIDTH, rotateY }}
            initial={{ ...from, rotateY: 0 }}
            animate={{ x: 0, y: 0, scale: 1, rotateY: 180 }}
            exit={{ ...from, rotateY: 0, opacity: 0 }}
            transition={{
              default: { type: 'spring', stiffness: 170, damping: 24, mass: 0.9 },
              rotateY: FLIP_TRANSITION,
              opacity: { duration: 0.2, delay: 0.3 },
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Front: the same look as the team card. */}
            <motion.div
              className={`${faceClass} flex flex-col self-start overflow-hidden rounded-3xl border border-[color:var(--booking-card-border)] [background:linear-gradient(var(--booking-card-bg),var(--booking-card-bg)),var(--booking-page-bg)] shadow-2xl`}
              style={{ opacity: frontOpacity }}
              aria-hidden
            >
              <Avatar employee={employee} className="aspect-square w-full text-7xl" />
              <p className="px-5 py-4 text-xl font-semibold text-[color:var(--booking-fg)]">{employee.name}</p>
            </motion.div>

            {/* Back: the profile. */}
            <motion.div
              className={`${faceClass} flex max-h-[85vh] flex-col self-start overflow-hidden rounded-3xl border border-[color:var(--booking-card-border)] [background:linear-gradient(var(--booking-card-bg),var(--booking-card-bg)),var(--booking-page-bg)] text-[color:var(--booking-fg)] shadow-2xl [transform:rotateY(180deg)]`}
              style={{ opacity: backOpacity }}
            >
              <div className="relative flex items-center gap-4 border-b border-[color:var(--booking-divide)] p-5">
                <Avatar employee={employee} className="h-16 w-16 shrink-0 rounded-2xl text-2xl" />
                <div className="min-w-0 pr-8">
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
                  {serviceNames.length === 0 ? (
                    <p className="text-sm text-[color:var(--booking-fg-muted)]">Sin servicios asignados.</p>
                  ) : (
                    <ul className="flex flex-wrap gap-2">
                      {serviceNames.map((name) => (
                        <li
                          key={name}
                          className="rounded-full border border-[color:var(--booking-border-soft)] bg-[color:var(--booking-control-bg)] px-3 py-1 text-sm"
                        >
                          {name}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {hours.length > 0 && (
                  <section>
                    <button
                      type="button"
                      onClick={() => setHoursOpen((open) => !open)}
                      aria-expanded={hoursOpen}
                      aria-controls="employee-profile-hours"
                      className="flex w-full items-center gap-2 rounded-xl border border-[color:var(--booking-border-soft)] bg-[color:var(--booking-control-bg)] px-3 py-2.5 text-left text-sm transition-colors hover:bg-[color:var(--booking-control-hover)]"
                    >
                      <Clock className="h-4 w-4 shrink-0 text-[color:var(--booking-cta-bg)]" aria-hidden />
                      <span className="font-semibold">Horario</span>
                      <span className="min-w-0 flex-1 truncate text-[color:var(--booking-fg-muted)]">
                        · Hoy {hoursLabel(byDay.get(today))}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[color:var(--booking-fg-muted)] transition-transform ${
                          hoursOpen ? 'rotate-180' : ''
                        }`}
                        aria-hidden
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {hoursOpen && (
                        <motion.ul
                          id="employee-profile-hours"
                          className="overflow-hidden text-sm"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {DAY_ORDER.map((d, i) => (
                            <li
                              key={d}
                              className={`flex justify-between gap-4 rounded-lg px-3 py-1.5 ${i === 0 ? 'mt-2' : 'mt-1'} ${
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
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </section>
                )}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
