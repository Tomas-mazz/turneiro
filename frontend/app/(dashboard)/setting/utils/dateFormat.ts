import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { AppointmentListItem } from '@/types'

export function formatDateTime(iso: string) {
  const d = new Date(iso)
  return format(d, "d MMM yyyy, HH:mm", { locale: es })
}

export function formatDateShort(iso: string) {
  const d = new Date(iso)
  return format(d, 'd/M')
}

export function groupAppointmentsByDate(appointments: AppointmentListItem[]) {
  const groups: Record<string, AppointmentListItem[]> = {}
  for (const a of appointments) {
    const key = format(new Date(a.startTime), 'yyyy-MM-dd')
    if (!groups[key]) groups[key] = []
    groups[key].push(a)
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
}

