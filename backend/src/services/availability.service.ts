import { prisma } from '../lib/prisma'
import { fromZonedTime } from 'date-fns-tz'
import { resolveSelectionDurations } from './selectionDurations.service'
import { employeeCanPerformSelections } from './employeeServiceRestrictions.service'

const ARGENTINA_TIMEZONE = 'America/Argentina/Buenos_Aires'

/** Parse "HH:MM" to minutes since midnight */
function timeToMinutes(s: string): number {
  const [h, m] = s.split(':').map(Number)
  return h * 60 + m
}

/** Minutes since midnight to "HH:MM" */
function minutesToTime(m: number): string {
  const h = Math.floor(m / 60)
  const mn = m % 60
  return `${h.toString().padStart(2, '0')}:${mn.toString().padStart(2, '0')}`
}

const DEFAULT_SLOT_INTERVAL_MINUTES = 15
const MINUTES_PER_DAY = 24 * 60

/**
 * Bounds of a calendar day (YYYY-MM-DD) in Argentina, as UTC instants.
 * Must not depend on the server timezone: Vercel runs in UTC, where a local
 * midnight would be 21:00 of the previous day in Argentina.
 */
function argentinaDayBounds(dateStr: string): { dayStart: Date; dayEnd: Date } {
  const dayStart = fromZonedTime(`${dateStr}T00:00:00`, ARGENTINA_TIMEZONE)
  const dayEnd = fromZonedTime(`${addDays(dateStr, 1)}T00:00:00`, ARGENTINA_TIMEZONE)
  return { dayStart, dayEnd }
}

/** YYYY-MM-DD plus n calendar days. */
function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T12:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** BlockedSlot.date is stored at noon UTC so it matches by calendar date in any timezone. */
function blockDateKey(dateStr: string): Date {
  return new Date(dateStr + 'T12:00:00.000Z')
}

/** Merge overlapping intervals [start, end] (in minutes). Input sorted by start. */
function mergeIntervals(intervals: [number, number][]): [number, number][] {
  if (intervals.length === 0) return []
  const sorted = [...intervals].sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = [sorted[0]]
  for (let i = 1; i < sorted.length; i++) {
    const [a, b] = merged[merged.length - 1]
    const [c, d] = sorted[i]
    if (c <= b) {
      merged[merged.length - 1] = [a, Math.max(b, d)]
    } else {
      merged.push([c, d])
    }
  }
  return merged
}

/** Subtract busy intervals from [segStart, segEnd]. Returns list of free [start, end] in minutes. */
function subtractBusyFromSegment(
  segStart: number,
  segEnd: number,
  busy: [number, number][]
): [number, number][] {
  let free: [number, number][] = [[segStart, segEnd]]
  for (const [bStart, bEnd] of busy) {
    const next: [number, number][] = []
    for (const [fStart, fEnd] of free) {
      if (bEnd <= fStart || bStart >= fEnd) {
        next.push([fStart, fEnd])
      } else {
        if (fStart < bStart) next.push([fStart, bStart])
        if (bEnd < fEnd) next.push([bEnd, fEnd])
      }
    }
    free = next
  }
  return free.filter(([a, b]) => b - a >= 0)
}

type WorkingHoursRow = {
  dayOfWeek: number
  isClosed: boolean
  startTime: string
  endTime: string
  lunchStart: string | null
  lunchEnd: string | null
}

type AppointmentRow = { startTime: Date; endTime: Date; employeeId?: string | null }

type BlockedSlotRow = {
  date: Date
  type: string
  startTime: string | null
  endTime: string | null
  employeeId: string | null
}

/**
 * Free start times ("HH:MM") for one agenda on one day, from already-loaded data.
 * `appointments` must already be scoped to the agenda (the employee, or the whole business).
 * Blocks without employeeId apply to everyone; employee blocks only apply to that employee.
 */
function computeDaySlots(input: {
  dateStr: string
  workingHours: WorkingHoursRow[]
  slotInterval: number
  duration: number
  appointments: AppointmentRow[]
  blockedSlots: BlockedSlotRow[]
  employeeId?: string
}): string[] {
  const { dateStr, workingHours, slotInterval, duration, appointments, blockedSlots, employeeId } = input

  const dayOfWeek = new Date(`${dateStr}T12:00:00.000Z`).getUTCDay()
  const working = workingHours.find((wh) => wh.dayOfWeek === dayOfWeek)
  if (!working || working.isClosed) return []

  const blocks = blockedSlots.filter(
    (b) =>
      b.date.getTime() === blockDateKey(dateStr).getTime() &&
      (b.employeeId === null || (!!employeeId && b.employeeId === employeeId))
  )
  if (blocks.some((b) => b.type === 'FULL_DAY')) return []

  const { dayStart, dayEnd } = argentinaDayBounds(dateStr)
  const busyIntervals: [number, number][] = []
  for (const a of appointments) {
    const start = new Date(a.startTime).getTime()
    const end = new Date(a.endTime).getTime()
    if (start >= dayEnd.getTime() || end <= dayStart.getTime()) continue
    // Minutes since Argentina midnight, clamped to this day (appointments may cross midnight).
    const startMin = Math.max(0, Math.floor((start - dayStart.getTime()) / 60000))
    const endMin = Math.min(MINUTES_PER_DAY, Math.ceil((end - dayStart.getTime()) / 60000))
    if (endMin > startMin) busyIntervals.push([startMin, endMin])
  }
  for (const b of blocks) {
    if (b.type !== 'TIME_SLOT' || !b.startTime || !b.endTime) continue
    busyIntervals.push([timeToMinutes(b.startTime), timeToMinutes(b.endTime)])
  }
  const mergedBusy = mergeIntervals(busyIntervals)

  const startMinutes = timeToMinutes(working.startTime)
  const endMinutes = timeToMinutes(working.endTime)
  const lunchStart = working.lunchStart ? timeToMinutes(working.lunchStart) : null
  const lunchEnd = working.lunchEnd ? timeToMinutes(working.lunchEnd) : null

  // Working segments: [startMinutes, endMinutes] possibly split by lunch
  const segments: [number, number][] = []
  if (lunchStart != null && lunchEnd != null) {
    if (startMinutes < lunchStart) segments.push([startMinutes, lunchStart])
    if (lunchEnd < endMinutes) segments.push([lunchEnd, endMinutes])
  } else {
    segments.push([startMinutes, endMinutes])
  }

  // Free intervals per segment, then generate slots at granularity within each
  const slotSet = new Set<string>()
  for (const [segStart, segEnd] of segments) {
    const free = subtractBusyFromSegment(segStart, segEnd, mergedBusy)
    for (const [freeStart, freeEnd] of free) {
      for (let t = freeStart; t + duration <= freeEnd; t += slotInterval) {
        slotSet.add(minutesToTime(t))
      }
    }
  }
  return Array.from(slotSet).sort()
}

async function loadBusinessForAvailability(businessSlug: string) {
  return prisma.business.findUnique({
    where: { slug: businessSlug },
    include: {
      workingHours: true,
      settings: { select: { slotIntervalMinutes: true } },
    },
  })
}

function slotIntervalOf(business: { settings: { slotIntervalMinutes: number | null } | null }): number {
  const configured = business.settings?.slotIntervalMinutes
  return configured && configured > 0 ? configured : DEFAULT_SLOT_INTERVAL_MINUTES
}

/**
 * Total duration of the selection for one agenda, or null when the agenda cannot be booked
 * for it (employee doesn't do one of the services, or a selection doesn't exist).
 */
async function selectionDurationFor(
  businessId: string,
  selectionIds: string[],
  employeeId?: string
): Promise<number | null> {
  if (employeeId) {
    const can = await employeeCanPerformSelections({
      businessId,
      employeeId,
      selectionIds,
      returnFalseOnMissing: true,
    })
    if (!can) return null
  }
  const resolved = await resolveSelectionDurations({
    businessId,
    selectionIds,
    employeeId,
    returnEmptyOnMissing: true,
  })
  if (resolved.length === 0) return null
  return resolved.reduce((acc, x) => acc + (Number.isFinite(x.duration) ? x.duration : 0), 0)
}

/** Appointments that occupy time: not cancelled, and unpaid holds only until they expire. */
async function loadBusyAppointments(params: {
  businessId: string
  from: Date
  to: Date
  employeeIds?: string[]
}): Promise<AppointmentRow[]> {
  const { businessId, from, to, employeeIds } = params
  return prisma.appointment.findMany({
    where: {
      businessId,
      status: { not: 'CANCELLED' },
      startTime: { lt: to },
      endTime: { gt: from },
      AND: [
        {
          OR: [
            { paymentStatus: { not: 'PENDING' } },
            { paymentHoldExpiresAt: null },
            { paymentHoldExpiresAt: { gt: new Date() } },
          ],
        },
      ],
      ...(employeeIds ? { employeeId: { in: employeeIds } } : {}),
    },
    select: { startTime: true, endTime: true, employeeId: true },
  })
}

async function loadBlockedSlots(businessId: string, fromDateStr: string, toDateStr: string) {
  const rows = await prisma.blockedSlot.findMany({
    where: {
      businessId,
      date: { gte: blockDateKey(fromDateStr), lte: blockDateKey(toDateStr) },
    },
  })
  return rows as unknown as BlockedSlotRow[]
}

/**
 * Available time slots for a single day.
 *
 * Multi-employee model (post-MVP):
 * - Business working hours remain at business level.
 * - Each employee gets their own agenda.
 * - If employeeId is provided, we only consider:
 *   - appointments for that employee (so other employees can book the same time)
 *   - blocked slots for that employee (plus global business-wide blocks with no employeeId)
 *
 * Returns array of "HH:MM" strings. Empty if business closed, no service, or full day blocked.
 * dateStr must be YYYY-MM-DD (same as frontend sends) so BlockedSlot query is timezone-safe.
 * `date` is kept for callers; the calendar day comes from dateStr.
 */
export async function getAvailabilityService(
  businessSlug: string,
  serviceIdOrIds: string | string[],
  date: Date,
  dateStr: string,
  employeeId?: string
): Promise<string[]> {
  const business = await loadBusinessForAvailability(businessSlug)
  if (!business) return []

  const requestedIds = Array.isArray(serviceIdOrIds) ? serviceIdOrIds : [serviceIdOrIds]
  if (requestedIds.length === 0) return []

  const duration = await selectionDurationFor(business.id, requestedIds, employeeId)
  if (duration == null) return []

  const { dayStart, dayEnd } = argentinaDayBounds(dateStr)
  const [appointments, blockedSlots] = await Promise.all([
    loadBusyAppointments({
      businessId: business.id,
      from: dayStart,
      to: dayEnd,
      employeeIds: employeeId ? [employeeId] : undefined,
    }),
    loadBlockedSlots(business.id, dateStr, dateStr),
  ])

  return computeDaySlots({
    dateStr,
    workingHours: business.workingHours,
    slotInterval: slotIntervalOf(business),
    duration,
    appointments,
    blockedSlots,
    employeeId,
  })
}

/**
 * For each day in the week starting at startDate, whether there is at least one available slot.
 * When the business has employees, hasSlots = true if at least one employee has at least one slot that day.
 * When there are no employees, uses single-resource availability (current behaviour).
 * We do not filter "today" by current time here; the frontend filters past slots when displaying.
 *
 * Loads the business, appointments and blocks once for the whole week (computing each day and
 * employee separately took 7 x N x several queries and several seconds).
 */
export async function getWeekAvailabilityService(
  businessSlug: string,
  serviceIdOrIds: string | string[],
  startDate: Date
): Promise<{ date: string; hasSlots: boolean }[]> {
  const y = startDate.getFullYear()
  const m = String(startDate.getMonth() + 1).padStart(2, '0')
  const d = String(startDate.getDate()).padStart(2, '0')
  const firstDateStr = `${y}-${m}-${d}`
  const dateStrs = Array.from({ length: 7 }, (_, i) => addDays(firstDateStr, i))

  const business = await loadBusinessForAvailability(businessSlug)
  const requestedIds = Array.isArray(serviceIdOrIds) ? serviceIdOrIds : [serviceIdOrIds]
  if (!business || requestedIds.length === 0) {
    return dateStrs.map((date) => ({ date, hasSlots: false }))
  }

  const employees = await prisma.employee.findMany({
    where: { businessId: business.id },
    select: { id: true },
  })
  // One agenda per employee, or a single business-wide agenda when there are no employees.
  const agendas: (string | undefined)[] = employees.length > 0 ? employees.map((e) => e.id) : [undefined]

  const { dayStart: from } = argentinaDayBounds(dateStrs[0])
  const { dayEnd: to } = argentinaDayBounds(dateStrs[dateStrs.length - 1])
  const [durations, appointments, blockedSlots] = await Promise.all([
    Promise.all(agendas.map((employeeId) => selectionDurationFor(business.id, requestedIds, employeeId))),
    loadBusyAppointments({ businessId: business.id, from, to }),
    loadBlockedSlots(business.id, dateStrs[0], dateStrs[dateStrs.length - 1]),
  ])

  const slotInterval = slotIntervalOf(business)
  return dateStrs.map((dateStr) => ({
    date: dateStr,
    hasSlots: agendas.some((employeeId, i) => {
      const duration = durations[i]
      if (duration == null) return false
      return (
        computeDaySlots({
          dateStr,
          workingHours: business.workingHours,
          slotInterval,
          duration,
          appointments: employeeId ? appointments.filter((a) => a.employeeId === employeeId) : appointments,
          blockedSlots,
          employeeId,
        }).length > 0
      )
    }),
  }))
}
