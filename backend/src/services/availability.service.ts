import { prisma } from '../lib/prisma'

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

/**
 * Available time slots for a single day.
 * Returns array of "HH:MM" strings. Empty if business closed, no service, or full day blocked.
 * dateStr must be YYYY-MM-DD (same as frontend sends) so BlockedSlot query is timezone-safe.
 */
export async function getAvailabilityService(
  businessSlug: string,
  serviceId: string,
  date: Date,
  dateStr: string
): Promise<string[]> {
  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
    include: {
      services: { where: { id: serviceId, isActive: true } },
      workingHours: true,
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
    },
    select: { startTime: true, endTime: true },
  })

  // Use noon UTC so we match BlockedSlot rows by calendar date in any timezone
  const dateForBlockQuery = new Date(dateStr + 'T12:00:00.000Z')
  const blockedSlots = await prisma.blockedSlot.findMany({
    where: {
      businessId: business.id,
      date: dateForBlockQuery,
    },
  })

  if (blockedSlots.some((b) => b.type === 'FULL_DAY')) return []

  const slots: string[] = []
  for (let t = startMinutes; t + duration <= endMinutes; t += duration) {
    if (lunchStart != null && lunchEnd != null) {
      const slotEnd = t + duration
      if (t < lunchEnd && slotEnd > lunchStart) continue
    }
    const slotStartDate = new Date(date)
    slotStartDate.setHours(Math.floor(t / 60), t % 60, 0, 0)
    const slotEndDate = new Date(slotStartDate.getTime() + duration * 60 * 1000)

    const overlapsAppointment = appointments.some(
      (a) => slotStartDate < a.endTime && slotEndDate > a.startTime
    )
    if (overlapsAppointment) continue

    const overlapsBlocked = blockedSlots
      .filter((b) => b.type === 'TIME_SLOT' && b.startTime && b.endTime)
      .some((b) => {
        const bStart = timeToMinutes(b.startTime!)
        const bEnd = timeToMinutes(b.endTime!)
        return t < bEnd && t + duration > bStart
      })
    if (overlapsBlocked) continue

    slots.push(minutesToTime(t))
  }

  return slots
}

/**
 * For each day in the week starting at startDate, whether there is at least one available slot.
 * Used by calendar to gray out days: tachado only when closed or no slots at all.
 * We do not filter "today" by current time here; the frontend filters past slots when displaying.
 */
export async function getWeekAvailabilityService(
  businessSlug: string,
  serviceId: string,
  startDate: Date
): Promise<{ date: string; hasSlots: boolean }[]> {
  const result: { date: string; hasSlots: boolean }[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const dateStr = `${y}-${m}-${day}`
    const slots = await getAvailabilityService(businessSlug, serviceId, d, dateStr)
    result.push({ date: dateStr, hasSlots: slots.length > 0 })
  }
  return result
}
