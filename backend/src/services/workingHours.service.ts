import { prisma } from '../lib/prisma'
import type { WorkingHoursItemInput } from '../lib/schemas'

const DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5, 6] as const

const defaultForDay = (dayOfWeek: number) => ({
  dayOfWeek,
  startTime: '09:00',
  endTime: '18:00',
  isClosed: dayOfWeek === 0 || dayOfWeek === 6,
  lunchStart: null as string | null,
  lunchEnd: null as string | null,
})

export interface WorkingHoursRow {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isClosed: boolean
  lunchStart: string | null
  lunchEnd: string | null
}

/**
 * Get working hours for a business. Returns 7 rows (one per day 0-6).
 * Missing days are filled with defaults (weekdays 09:00-18:00, weekend closed).
 */
export async function getWorkingHoursForBusiness(
  businessId: string
): Promise<WorkingHoursRow[]> {
  const existing = await prisma.workingHours.findMany({
    where: { businessId },
    orderBy: { dayOfWeek: 'asc' },
  })

  const byDay = new Map(existing.map((r) => [r.dayOfWeek, r]))
  return DAYS_OF_WEEK.map((dayOfWeek) => {
    const row = byDay.get(dayOfWeek)
    if (row) {
      return {
        id: row.id,
        dayOfWeek: row.dayOfWeek,
        startTime: row.startTime,
        endTime: row.endTime,
        isClosed: row.isClosed,
        lunchStart: row.lunchStart,
        lunchEnd: row.lunchEnd,
      }
    }
    const def = defaultForDay(dayOfWeek)
    return {
      id: '',
      dayOfWeek: def.dayOfWeek,
      startTime: def.startTime,
      endTime: def.endTime,
      isClosed: def.isClosed,
      lunchStart: def.lunchStart,
      lunchEnd: def.lunchEnd,
    }
  })
}

/**
 * Upsert working hours for a business. Replaces all 7 days.
 * Verifies business exists.
 */
export async function upsertWorkingHoursForBusiness(
  businessId: string,
  hours: WorkingHoursItemInput[]
): Promise<WorkingHoursRow[]> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
  })
  if (!business) {
    throw new Error('Negocio no encontrado')
  }

  await prisma.workingHours.deleteMany({
    where: { businessId },
  })

  const sorted = [...hours].sort((a, b) => a.dayOfWeek - b.dayOfWeek)
  await prisma.workingHours.createMany({
    data: sorted.map((h) => ({
      businessId,
      dayOfWeek: h.dayOfWeek,
      startTime: h.startTime,
      endTime: h.endTime,
      isClosed: h.isClosed,
      lunchStart: h.lunchStart ?? null,
      lunchEnd: h.lunchEnd ?? null,
    })),
  })

  return getWorkingHoursForBusiness(businessId)
}
