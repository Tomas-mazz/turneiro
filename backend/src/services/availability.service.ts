import { prisma } from '../lib/prisma'
import { toZonedTime } from 'date-fns-tz'

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
 */
export async function getAvailabilityService(
  businessSlug: string,
  serviceId: string,
  date: Date,
  dateStr: string,
  employeeId?: string
): Promise<string[]> {
  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
    include: {
      services: { where: { id: serviceId, isActive: true } },
      workingHours: true,
      settings: {
        select: {
          slotIntervalMinutes: true,
        },
      },
    },
  })

  if (!business) return []
  const service = business.services[0]
  if (!service) return []

  const dayOfWeek = date.getDay()
  const working = business.workingHours.find((wh) => wh.dayOfWeek === dayOfWeek)
  if (!working || working.isClosed) return []

  const startMinutes = timeToMinutes(working.startTime)
  const endMinutes = timeToMinutes(working.endTime)
  const lunchStart = working.lunchStart ? timeToMinutes(working.lunchStart) : null
  const lunchEnd = working.lunchEnd ? timeToMinutes(working.lunchEnd) : null
  const duration = service.duration
  const slotInterval =
    business.settings?.slotIntervalMinutes && business.settings.slotIntervalMinutes > 0
      ? business.settings.slotIntervalMinutes
      : DEFAULT_SLOT_INTERVAL_MINUTES

  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)

  const appointments = await prisma.appointment.findMany({
    where: {
      businessId: business.id,
      status: { not: 'CANCELLED' },
      startTime: { lt: dayEnd },
      endTime: { gt: dayStart },
      ...(employeeId ? { employeeId } : {}),
    },
    select: { startTime: true, endTime: true },
  })

  // Use noon UTC so we match BlockedSlot rows by calendar date in any timezone
  const dateForBlockQuery = new Date(dateStr + 'T12:00:00.000Z')
  const blockedSlotsRaw = await prisma.blockedSlot.findMany({
    where: {
      businessId: business.id,
      date: dateForBlockQuery,
    },
  })
  type BlockedSlotRow = {
    type: string
    startTime: string | null
    endTime: string | null
    employeeId: string | null
  }
  const blockedSlots = blockedSlotsRaw as unknown as BlockedSlotRow[]

  // A full-day block without employeeId blocks the whole business.
  // A full-day block with employeeId blocks only that employee.
  const hasFullDayBlock = blockedSlots.some((b) => {
    if (b.type !== 'FULL_DAY') return false
    // When no employeeId is provided (single-resource business), only business-wide
    // blocks (employeeId === null) should apply.
    if (!employeeId) {
      return b.employeeId === null
    }
    // When an employeeId is provided, apply:
    // - global business blocks (employeeId === null)
    // - plus blocks specific to that employee.
    return b.employeeId === null || b.employeeId === employeeId
  })

  if (hasFullDayBlock) {
    return []
  }

  // Build busy intervals (minutes since midnight in Argentina timezone) from appointments and TIME_SLOT blocks
  const busyIntervals: [number, number][] = []
  for (const a of appointments) {
    const aStartArg = toZonedTime(new Date(a.startTime), ARGENTINA_TIMEZONE)
    const aEndArg = toZonedTime(new Date(a.endTime), ARGENTINA_TIMEZONE)
    const dayStartMin = 0
    const dayEndMin = 24 * 60
    const startMin = Math.max(dayStartMin, aStartArg.getHours() * 60 + aStartArg.getMinutes())
    const endMin = Math.min(dayEndMin, aEndArg.getHours() * 60 + aEndArg.getMinutes())
    if (endMin > startMin) busyIntervals.push([startMin, endMin])
  }
  for (const b of blockedSlots) {
    if (b.type !== 'TIME_SLOT' || !b.startTime || !b.endTime) continue
    if (employeeId) {
      // When an employeeId is provided, apply:
      // - global business blocks (employeeId === null)
      // - plus blocks specific to that employee.
      if (b.employeeId && b.employeeId !== employeeId) continue
    } else {
      // When no employeeId is provided (single-resource business),
      // only business-wide blocks (employeeId === null) should apply.
      if (b.employeeId) continue
    }
    busyIntervals.push([timeToMinutes(b.startTime), timeToMinutes(b.endTime)])
  }
  const mergedBusy = mergeIntervals(busyIntervals)

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
  const slots = Array.from(slotSet).sort()
  return slots
}

/**
 * For each day in the week starting at startDate, whether there is at least one available slot.
 * When the business has employees, hasSlots = true if at least one employee has at least one slot that day.
 * When there are no employees, uses single-resource availability (current behaviour).
 * We do not filter "today" by current time here; the frontend filters past slots when displaying.
 */
export async function getWeekAvailabilityService(
  businessSlug: string,
  serviceId: string,
  startDate: Date
): Promise<{ date: string; hasSlots: boolean }[]> {
  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
    select: { id: true },
  })
  const employeeIds: string[] = []
  if (business) {
    const employees = await prisma.employee.findMany({
      where: { businessId: business.id },
      select: { id: true },
    })
    employeeIds.push(...employees.map((e) => e.id))
  }

  const result: { date: string; hasSlots: boolean }[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const dateStr = `${y}-${m}-${day}`

    let hasSlots = false
    if (employeeIds.length > 0) {
      for (const employeeId of employeeIds) {
        const slots = await getAvailabilityService(
          businessSlug,
          serviceId,
          d,
          dateStr,
          employeeId
        )
        if (slots.length > 0) {
          hasSlots = true
          break
        }
      }
    } else {
      const slots = await getAvailabilityService(businessSlug, serviceId, d, dateStr)
      hasSlots = slots.length > 0
    }
    result.push({ date: dateStr, hasSlots })
  }
  return result
}
