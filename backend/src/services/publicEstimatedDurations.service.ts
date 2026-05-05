import { prisma } from '../lib/prisma'

type PublicService = {
  id: string
  duration: number
  subServices?: Array<{ id: string; duration: number }>
}

export type EstimatedRange = { estimatedDurationMin: number; estimatedDurationMax: number }

type OverrideRow = {
  employeeId: string
  serviceId: string | null
  subServiceId: string | null
  duration: number
}

function resolveRangeFromEmployees(
  employeeIds: string[],
  baseDuration: number,
  overrideLookup: (employeeId: string) => number | undefined
): EstimatedRange {
  if (employeeIds.length === 0) {
    return { estimatedDurationMin: baseDuration, estimatedDurationMax: baseDuration }
  }
  let min = Number.POSITIVE_INFINITY
  let max = 0
  for (const empId of employeeIds) {
    const d = overrideLookup(empId) ?? baseDuration
    if (d < min) min = d
    if (d > max) max = d
  }
  if (!Number.isFinite(min) || max <= 0) {
    return { estimatedDurationMin: baseDuration, estimatedDurationMax: baseDuration }
  }
  return { estimatedDurationMin: min, estimatedDurationMax: max }
}

/**
 * For the public booking page, compute duration estimate ranges (min/max)
 * across employees for each service/subservice.
 *
 * This is UI-only: availability/endTime still use the chosen employee override.
 */
export async function attachPublicEstimatedDurations<T extends { id: string; employees: { id: string }[]; services: PublicService[] }>(
  business: T
): Promise<
  T & {
    services: Array<
      PublicService &
        EstimatedRange & {
          subServices?: Array<{ id: string; duration: number } & EstimatedRange>
        }
    >
  }
> {
  const employeeIds = business.employees.map((e) => e.id)
  const serviceIds = business.services.map((s) => s.id)
  const subServiceIds = business.services.flatMap((s) => (s.subServices ?? []).map((sub) => sub.id))

  const overrides =
    employeeIds.length > 0 && (serviceIds.length > 0 || subServiceIds.length > 0)
      ? ((await prisma.employeeServiceDuration.findMany({
          where: {
            employeeId: { in: employeeIds },
            OR: [
              serviceIds.length > 0 ? { serviceId: { in: serviceIds } } : undefined,
              subServiceIds.length > 0 ? { subServiceId: { in: subServiceIds } } : undefined,
            ].filter(Boolean) as any,
          },
          select: { employeeId: true, serviceId: true, subServiceId: true, duration: true },
        })) as unknown as OverrideRow[])
      : []

  const byEmployeeService = new Map<string, number>()
  const byEmployeeSub = new Map<string, number>()
  for (const o of overrides) {
    if (o.serviceId) byEmployeeService.set(`${o.employeeId}:${o.serviceId}`, o.duration)
    if (o.subServiceId) byEmployeeSub.set(`${o.employeeId}:${o.subServiceId}`, o.duration)
  }

  const services = business.services.map((svc) => {
    const range = resolveRangeFromEmployees(employeeIds, svc.duration, (empId) =>
      byEmployeeService.get(`${empId}:${svc.id}`)
    )
    const subServices = (svc.subServices ?? []).map((sub) => {
      const subRange = resolveRangeFromEmployees(employeeIds, sub.duration, (empId) =>
        byEmployeeSub.get(`${empId}:${sub.id}`)
      )
      return { ...sub, ...subRange }
    })
    return { ...svc, ...range, ...(svc.subServices ? { subServices } : {}) }
  })

  return { ...(business as any), services }
}

