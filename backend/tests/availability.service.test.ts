import { beforeEach, describe, expect, it, vi } from 'vitest'

type WorkingHoursRow = {
  dayOfWeek: number
  isClosed: boolean
  startTime: string
  endTime: string
  lunchStart: string | null
  lunchEnd: string | null
}

type AppointmentRow = {
  businessId: string
  employeeId: string | null
  startTime: Date
  endTime: Date
  status: string
  paymentStatus: string
  paymentHoldExpiresAt: Date | null
}

type BlockedSlotRow = {
  businessId: string
  date: Date
  type: 'FULL_DAY' | 'TIME_SLOT'
  startTime: string | null
  endTime: string | null
  employeeId: string | null
}

// In-memory "database" that the mocked Prisma client queries.
const db = vi.hoisted(() => ({
  business: null as null | {
    id: string
    slug: string
    workingHours: WorkingHoursRow[]
    settings: { slotIntervalMinutes: number | null } | null
  },
  employees: [] as { id: string; businessId: string }[],
  appointments: [] as AppointmentRow[],
  blockedSlots: [] as BlockedSlotRow[],
  duration: 30,
  employeeCanPerform: (() => true) as (employeeId: string) => boolean,
}))

/** Minimal evaluator for the appointment.findMany `where` used by the availability service. */
function matchesAppointmentWhere(a: AppointmentRow, where: any): boolean {
  if (where.businessId && a.businessId !== where.businessId) return false
  if (where.status?.not && a.status === where.status.not) return false
  if (where.startTime?.lt && !(a.startTime < where.startTime.lt)) return false
  if (where.endTime?.gt && !(a.endTime > where.endTime.gt)) return false
  if (typeof where.employeeId === 'string' && a.employeeId !== where.employeeId) return false
  if (where.employeeId?.in && !where.employeeId.in.includes(a.employeeId)) return false
  for (const clause of where.AND ?? []) {
    const ok = (clause.OR ?? []).some((cond: any) => {
      if (cond.paymentStatus?.not) return a.paymentStatus !== cond.paymentStatus.not
      if ('paymentHoldExpiresAt' in cond && cond.paymentHoldExpiresAt === null) {
        return a.paymentHoldExpiresAt === null
      }
      if (cond.paymentHoldExpiresAt?.gt) {
        return a.paymentHoldExpiresAt !== null && a.paymentHoldExpiresAt > cond.paymentHoldExpiresAt.gt
      }
      return false
    })
    if (!ok) return false
  }
  return true
}

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    business: {
      findUnique: vi.fn(async ({ where }: any) =>
        db.business && db.business.slug === where.slug ? db.business : null,
      ),
    },
    employee: {
      findMany: vi.fn(async ({ where }: any) =>
        db.employees.filter((e) => e.businessId === where.businessId && (!where.id || e.id === where.id)),
      ),
    },
    appointment: {
      findMany: vi.fn(async ({ where }: any) =>
        db.appointments
          .filter((a) => matchesAppointmentWhere(a, where))
          .map(({ startTime, endTime, employeeId }) => ({ startTime, endTime, employeeId })),
      ),
    },
    blockedSlot: {
      findMany: vi.fn(async ({ where }: any) =>
        db.blockedSlots.filter((b) => {
          if (b.businessId !== where.businessId) return false
          const t = b.date.getTime()
          if (where.date instanceof Date) return t === where.date.getTime()
          return t >= where.date.gte.getTime() && t <= where.date.lte.getTime()
        }),
      ),
    },
  },
}))

vi.mock('../src/services/selectionDurations.service', () => ({
  resolveSelectionDurations: vi.fn(async ({ selectionIds }: { selectionIds: string[] }) =>
    selectionIds.includes('missing')
      ? []
      : [{ id: selectionIds[0], kind: 'SERVICE', baseServiceId: selectionIds[0], duration: db.duration }],
  ),
}))

vi.mock('../src/services/employeeServiceRestrictions.service', () => ({
  employeeCanPerformSelections: vi.fn(async ({ employeeId }: { employeeId: string }) =>
    db.employeeCanPerform(employeeId),
  ),
}))

import { getAvailabilityService, getWeekAvailabilityService } from '../src/services/availability.service'

const BUSINESS_ID = 'biz_1'
const SLUG = 'barberia-test'
// 2026-10-26 is a Monday.
const MONDAY = '2026-10-26'
const TUESDAY = '2026-10-27'

/** A Date for a wall-clock time in Argentina (UTC-3, no DST). */
const ar = (date: string, time: string) => new Date(`${date}T${time}:00-03:00`)

/** Same date construction as availability.controller.ts. */
const slotsFor = (dateStr: string, employeeId?: string, serviceIds: string | string[] = 'svc_1') =>
  getAvailabilityService(SLUG, serviceIds, new Date(dateStr + 'T12:00:00'), dateStr, employeeId)

const hours = (
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  lunch?: [string, string],
): WorkingHoursRow => ({
  dayOfWeek,
  isClosed: false,
  startTime,
  endTime,
  lunchStart: lunch?.[0] ?? null,
  lunchEnd: lunch?.[1] ?? null,
})

const appointment = (overrides: Partial<AppointmentRow> & Pick<AppointmentRow, 'startTime' | 'endTime'>) => {
  db.appointments.push({
    businessId: BUSINESS_ID,
    employeeId: null,
    status: 'UPCOMING',
    paymentStatus: 'NOT_REQUIRED',
    paymentHoldExpiresAt: null,
    ...overrides,
  })
}

const block = (overrides: Partial<BlockedSlotRow> & Pick<BlockedSlotRow, 'type'>) => {
  db.blockedSlots.push({
    businessId: BUSINESS_ID,
    date: new Date(`${MONDAY}T12:00:00.000Z`),
    startTime: null,
    endTime: null,
    employeeId: null,
    ...overrides,
  })
}

beforeEach(() => {
  db.business = {
    id: BUSINESS_ID,
    slug: SLUG,
    workingHours: [hours(1, '09:00', '13:00'), hours(2, '09:00', '13:00')],
    settings: { slotIntervalMinutes: 30 },
  }
  db.employees = []
  db.appointments = []
  db.blockedSlots = []
  db.duration = 30
  db.employeeCanPerform = () => true
})

describe('getAvailabilityService: working hours', () => {
  it('returns every slot of an open day with no bookings', async () => {
    expect(await slotsFor(MONDAY)).toEqual([
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
    ])
  })

  it('returns nothing when the day has no working hours or is closed', async () => {
    db.business!.workingHours = [{ ...hours(1, '09:00', '13:00'), isClosed: true }]
    expect(await slotsFor(MONDAY)).toEqual([])
    expect(await slotsFor('2026-10-25')).toEqual([]) // Sunday, no row
  })

  it('returns nothing for an unknown business or an unknown service', async () => {
    expect(await getAvailabilityService('nope', 'svc_1', new Date(MONDAY + 'T12:00:00'), MONDAY)).toEqual([])
    expect(await slotsFor(MONDAY, undefined, 'missing')).toEqual([])
    expect(await slotsFor(MONDAY, undefined, [])).toEqual([])
  })

  it('skips the lunch break', async () => {
    db.business!.workingHours = [hours(1, '09:00', '15:00', ['12:00', '13:00'])]
    expect(await slotsFor(MONDAY)).toEqual([
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30',
    ])
  })

  it('only offers slots where the whole service fits before closing', async () => {
    db.duration = 60
    expect(await slotsFor(MONDAY)).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00'])
  })

  it('uses a 15 minute interval when the business has none configured', async () => {
    db.business!.settings = null
    db.business!.workingHours = [hours(1, '09:00', '10:00')]
    expect(await slotsFor(MONDAY)).toEqual(['09:00', '09:15', '09:30'])
  })
})

describe('getAvailabilityService: existing appointments', () => {
  it('removes slots that overlap a booked appointment', async () => {
    appointment({ startTime: ar(MONDAY, '10:00'), endTime: ar(MONDAY, '10:30') })
    db.duration = 60
    expect(await slotsFor(MONDAY)).toEqual(['09:00', '10:30', '11:00', '11:30', '12:00'])
  })

  it('ignores cancelled appointments', async () => {
    appointment({ startTime: ar(MONDAY, '10:00'), endTime: ar(MONDAY, '10:30'), status: 'CANCELLED' })
    expect(await slotsFor(MONDAY)).toContain('10:00')
  })

  it('keeps a slot held while its payment hold is active and frees it once the hold expires', async () => {
    const pending = { startTime: ar(MONDAY, '10:00'), endTime: ar(MONDAY, '10:30'), paymentStatus: 'PENDING' }
    appointment({ ...pending, paymentHoldExpiresAt: new Date(Date.now() + 5 * 60_000) })
    expect(await slotsFor(MONDAY)).not.toContain('10:00')

    db.appointments = []
    appointment({ ...pending, paymentHoldExpiresAt: new Date(Date.now() - 60_000) })
    expect(await slotsFor(MONDAY)).toContain('10:00')
  })

  it("only blocks the booked employee's agenda", async () => {
    appointment({ startTime: ar(MONDAY, '10:00'), endTime: ar(MONDAY, '10:30'), employeeId: 'emp_a' })
    expect(await slotsFor(MONDAY, 'emp_a')).not.toContain('10:00')
    expect(await slotsFor(MONDAY, 'emp_b')).toContain('10:00')
  })

  it('returns nothing when the employee cannot perform the service', async () => {
    db.employeeCanPerform = (id) => id !== 'emp_a'
    expect(await slotsFor(MONDAY, 'emp_a')).toEqual([])
    expect(await slotsFor(MONDAY, 'emp_b')).not.toEqual([])
  })
})

describe('getAvailabilityService: blocked slots', () => {
  it('a business-wide full-day block closes the day for everyone', async () => {
    block({ type: 'FULL_DAY' })
    expect(await slotsFor(MONDAY)).toEqual([])
    expect(await slotsFor(MONDAY, 'emp_a')).toEqual([])
  })

  it("an employee's full-day block only closes that employee's day", async () => {
    block({ type: 'FULL_DAY', employeeId: 'emp_a' })
    expect(await slotsFor(MONDAY, 'emp_a')).toEqual([])
    expect(await slotsFor(MONDAY, 'emp_b')).not.toEqual([])
    expect(await slotsFor(MONDAY)).not.toEqual([])
  })

  it('a time block removes the slots it overlaps', async () => {
    block({ type: 'TIME_SLOT', startTime: '11:00', endTime: '12:00' })
    expect(await slotsFor(MONDAY)).toEqual(['09:00', '09:30', '10:00', '10:30', '12:00', '12:30'])
  })

  it("an employee's time block does not affect other employees", async () => {
    block({ type: 'TIME_SLOT', startTime: '11:00', endTime: '12:00', employeeId: 'emp_a' })
    expect(await slotsFor(MONDAY, 'emp_a')).not.toContain('11:00')
    expect(await slotsFor(MONDAY, 'emp_b')).toContain('11:00')
  })

  it('blocks on another date do not apply', async () => {
    block({ type: 'FULL_DAY', date: new Date(`${TUESDAY}T12:00:00.000Z`) })
    expect(await slotsFor(MONDAY)).not.toEqual([])
    expect(await slotsFor(TUESDAY)).toEqual([])
  })
})

describe('getAvailabilityService: late hours in Argentina (server in UTC)', () => {
  beforeEach(() => {
    db.business!.workingHours = [hours(1, '18:00', '23:00'), hours(2, '18:00', '23:00')]
  })

  it('an appointment that ends after 21:00 does not block the same time on the next day', async () => {
    appointment({ startTime: ar(MONDAY, '20:30'), endTime: ar(MONDAY, '21:30') })
    expect(await slotsFor(MONDAY)).not.toContain('20:30')
    expect(await slotsFor(MONDAY)).not.toContain('21:00')
    expect(await slotsFor(TUESDAY)).toContain('20:30')
    expect(await slotsFor(TUESDAY)).toContain('21:00')
  })

  it('an appointment that starts at or after 21:00 blocks its own day', async () => {
    appointment({ startTime: ar(MONDAY, '21:30'), endTime: ar(MONDAY, '22:00') })
    expect(await slotsFor(MONDAY)).not.toContain('21:30')
    expect(await slotsFor(MONDAY)).toContain('21:00')
  })
})

describe('getWeekAvailabilityService', () => {
  it('reports which of the next 7 days have at least one slot', async () => {
    const week = await getWeekAvailabilityService(SLUG, 'svc_1', new Date(MONDAY + 'T12:00:00'))
    expect(week.map((d) => d.date)).toEqual([
      '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01',
    ])
    expect(week.map((d) => d.hasSlots)).toEqual([true, true, false, false, false, false, false])
  })

  it('a day has slots if at least one employee is free', async () => {
    db.employees = [
      { id: 'emp_a', businessId: BUSINESS_ID },
      { id: 'emp_b', businessId: BUSINESS_ID },
    ]
    block({ type: 'FULL_DAY', employeeId: 'emp_a' })
    const monday = (await getWeekAvailabilityService(SLUG, 'svc_1', new Date(MONDAY + 'T12:00:00')))[0]
    expect(monday).toEqual({ date: MONDAY, hasSlots: true })

    block({ type: 'FULL_DAY', employeeId: 'emp_b' })
    const mondayAllBlocked = (await getWeekAvailabilityService(SLUG, 'svc_1', new Date(MONDAY + 'T12:00:00')))[0]
    expect(mondayAllBlocked).toEqual({ date: MONDAY, hasSlots: false })
  })

  it('only looks at the chosen professional when employeeId is given', async () => {
    db.employees = [
      { id: 'emp_a', businessId: BUSINESS_ID },
      { id: 'emp_b', businessId: BUSINESS_ID },
    ]
    block({ type: 'FULL_DAY', employeeId: 'emp_a' })
    const start = new Date(MONDAY + 'T12:00:00')
    expect((await getWeekAvailabilityService(SLUG, 'svc_1', start, 'emp_a'))[0].hasSlots).toBe(false)
    expect((await getWeekAvailabilityService(SLUG, 'svc_1', start, 'emp_b'))[0].hasSlots).toBe(true)
    expect((await getWeekAvailabilityService(SLUG, 'svc_1', start, 'emp_unknown'))[0].hasSlots).toBe(false)
  })
})
