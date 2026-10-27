'use client'

import { useState } from 'react'
import { ChevronDown, Clock, MapPin, Phone, Star } from 'lucide-react'
import type { Business } from '../types'
import { BOOKING_TIMEZONE } from '../utils'
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from './BrandIcons'

export const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

type WorkingHours = Business['workingHours'][number]

export function hoursLabel(wh: WorkingHours | undefined): string {
  if (!wh || wh.isClosed) return 'Cerrado'
  if (wh.lunchStart && wh.lunchEnd) {
    return `${wh.startTime} a ${wh.lunchStart} y ${wh.lunchEnd} a ${wh.endTime}`
  }
  return `${wh.startTime} a ${wh.endTime}`
}

export function todayDayOfWeek(): number {
  const weekday = new Date().toLocaleDateString('en-US', { timeZone: BOOKING_TIMEZONE, weekday: 'short' })
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday)
}

const iconBtnClass =
  'flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--booking-border)] bg-[color:var(--booking-control-bg)] text-[color:var(--booking-control-text)] transition-colors hover:bg-[color:var(--booking-control-hover)]'

/** Opening hours, contact and social links under the cover. Hides anything the business didn't fill in. */
export function BusinessInfoBar({ business }: { business: Business }) {
  const [hoursOpen, setHoursOpen] = useState(false)
  const byDay = new Map(business.workingHours.map((wh) => [wh.dayOfWeek, wh]))
  const today = todayDayOfWeek()
  const hasHours = business.workingHours.length > 0
  const mapsHref =
    business.mapsUrl ||
    (business.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`
      : null)

  const socials = [
    business.whatsapp && {
      href: `https://wa.me/${business.whatsapp}`,
      label: 'WhatsApp',
      icon: <WhatsAppIcon className="h-5 w-5" />,
    },
    business.instagram && {
      href: `https://instagram.com/${business.instagram}`,
      label: 'Instagram',
      icon: <InstagramIcon className="h-5 w-5" />,
    },
    business.facebook && {
      href: business.facebook,
      label: 'Facebook',
      icon: <FacebookIcon className="h-5 w-5" />,
    },
    business.googleReviewsUrl && {
      href: business.googleReviewsUrl,
      label: 'Reseñas en Google',
      icon: <Star className="h-5 w-5" />,
    },
  ].filter(Boolean) as { href: string; label: string; icon: React.ReactNode }[]

  if (!hasHours && !business.phone && !business.address && socials.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-full rounded-2xl border border-[color:var(--booking-card-border)] bg-[color:var(--booking-card-bg)] px-4 py-1 text-sm text-[color:var(--booking-fg-muted)] shadow-sm md:w-fit md:px-2 md:py-2">
      {/* One row on desktop with vertical dividers; stacked rows with horizontal dividers on phones. */}
      <div className="flex flex-col divide-y divide-[color:var(--booking-divide)] md:flex-row md:items-center md:justify-center md:divide-x md:divide-y-0">
          {hasHours && (
            <button
              type="button"
              onClick={() => setHoursOpen((o) => !o)}
              aria-expanded={hoursOpen}
              className="flex items-center gap-2 py-3 text-left hover:text-[color:var(--booking-link-hover)] md:px-5 md:py-1"
            >
              <Clock className="h-4 w-4 shrink-0" aria-hidden />
              <span>
                <span className="font-medium text-[color:var(--booking-fg)]">Hoy:</span>{' '}
                {hoursLabel(byDay.get(today))}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 transition-transform ${hoursOpen ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>
          )}
          {business.phone && (
            <a
              href={`tel:${business.phone.replace(/\s/g, '')}`}
              className="flex items-center gap-2 py-3 hover:text-[color:var(--booking-link-hover)] md:px-5 md:py-1"
            >
              <Phone className="h-4 w-4 shrink-0" aria-hidden />
              {business.phone}
            </a>
          )}
          {business.address && (
            <a
              href={mapsHref ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 py-3 hover:text-[color:var(--booking-link-hover)] md:px-5 md:py-1"
            >
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              {business.address}
            </a>
          )}

        {socials.length > 0 && (
          <div className="flex items-center gap-2 py-3 md:px-4 md:py-0">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                title={s.label}
                className={iconBtnClass}
              >
                {s.icon}
              </a>
            ))}
          </div>
        )}
      </div>

      {hoursOpen && (
        <ul className="mb-2 mt-1 grid gap-1 border-t border-[color:var(--booking-divide)] px-1 pt-3 sm:grid-cols-2 sm:gap-x-8 md:px-5">
          {DAY_ORDER.map((d) => (
            <li
              key={d}
              className={`flex justify-between gap-4 ${d === today ? 'font-medium text-[color:var(--booking-fg)]' : ''}`}
            >
              <span>{DAY_NAMES[d]}</span>
              <span className="text-right">{hoursLabel(byDay.get(d))}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
