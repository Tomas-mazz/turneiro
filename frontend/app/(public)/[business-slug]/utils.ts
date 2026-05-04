import type { ServiceOption } from './types'

/** Base service/subservicio price plus optional adicionales. */
export function serviceOptionTotalPrice(s: ServiceOption): number {
  const extras = (s.addOns ?? []).reduce((acc, a) => acc + (Number.isFinite(a.price) ? a.price : 0), 0)
  return (Number.isFinite(s.price) ? s.price : 0) + extras
}

/** Default timezone for the booking page (Argentina) */
export const BOOKING_TIMEZONE = 'America/Argentina/Buenos_Aires'

/** Calendar date YYYY-MM-DD in local time (so blocked days match dashboard-selected date) */
export function formatDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Current date and time in Argentina (for default booking page behaviour) */
export function getNowInArgentina(): { dateKey: string; timeStr: string } {
  const now = new Date()
  const dateKey = now.toLocaleDateString('en-CA', { timeZone: BOOKING_TIMEZONE }) // YYYY-MM-DD
  const parts = now.toLocaleTimeString('en-GB', {
    timeZone: BOOKING_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const timeStr = parts.slice(0, 5) // HH:MM (some envs return HH:MM:SS)
  return { dateKey, timeStr }
}

export function getMonthStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function getMonthEnd(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}
