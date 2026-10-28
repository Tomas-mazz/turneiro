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

export class EmployeeNotInBusinessError extends Error {
  constructor() {
    super('Empleado no encontrado')
    this.name = 'EmployeeNotInBusinessError'
  }
}

async function assertEmployeeInBusiness(businessId: string, employeeId: string): Promise<void> {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, businessId },
    select: { id: true },
  })
  if (!employee) throw new EmployeeNotInBusinessError()
}

/**
 * Schedule of one employee for the 7 days. `custom` is false when they follow the business
 * hours; days they did not set show the business hours.
 */
export async function getEmployeeWorkingHours(
  businessId: string,
  employeeId: string
): Promise<{ custom: boolean; hours: WorkingHoursRow[] }> {
  await assertEmployeeInBusiness(businessId, employeeId)
  const [businessHours, own] = await Promise.all([
    getWorkingHoursForBusiness(businessId),
    prisma.employeeWorkingHours.findMany({ where: { employeeId } }),
  ])
  const byDay = new Map(own.map((r) => [r.dayOfWeek, r]))
  return {
    custom: own.length > 0,
    hours: businessHours.map((bh) => {
      const row = byDay.get(bh.dayOfWeek)
      if (!row) return bh
      return {
        id: row.id,
        dayOfWeek: row.dayOfWeek,
        startTime: row.startTime,
        endTime: row.endTime,
        isClosed: row.isClosed,
        lunchStart: row.lunchStart,
        lunchEnd: row.lunchEnd,
      }
    }),
  }
}

/** Give an employee their own schedule (replaces all 7 days). */
export async function replaceEmployeeWorkingHours(
  businessId: string,
  employeeId: string,
  hours: WorkingHoursItemInput[]
): Promise<{ custom: boolean; hours: WorkingHoursRow[] }> {
  await assertEmployeeInBusiness(businessId, employeeId)
  await prisma.$transaction([
    prisma.employeeWorkingHours.deleteMany({ where: { employeeId } }),
    prisma.employeeWorkingHours.createMany({
      data: hours.map((h) => ({
        employeeId,
        dayOfWeek: h.dayOfWeek,
        startTime: h.startTime,
        endTime: h.endTime,
        isClosed: h.isClosed,
        lunchStart: h.lunchStart ?? null,
        lunchEnd: h.lunchEnd ?? null,
      })),
    }),
  ])
  return getEmployeeWorkingHours(businessId, employeeId)
}

/** Back to the business hours. */
export async function resetEmployeeWorkingHours(
  businessId: string,
  employeeId: string
): Promise<{ custom: boolean; hours: WorkingHoursRow[] }> {
  await assertEmployeeInBusiness(businessId, employeeId)
  await prisma.employeeWorkingHours.deleteMany({ where: { employeeId } })
  return getEmployeeWorkingHours(businessId, employeeId)
}
