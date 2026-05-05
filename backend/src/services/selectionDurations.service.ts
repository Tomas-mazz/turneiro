import { prisma } from '../lib/prisma'

export type SelectionKind = 'SERVICE' | 'SUBSERVICE'

export type ResolvedSelectionDuration = {
  id: string
  kind: SelectionKind
  baseServiceId: string
  duration: number
}

type ResolveOptions = {
  businessId: string
  selectionIds: string[]
  employeeId?: string
  /** When true, silently drop if any selection is missing. */
  returnEmptyOnMissing?: boolean
}

/**
 * Resolve durations for a mixed list of Service/SubService ids.
 * If employeeId is provided, applies per-employee overrides when present.
 */
export async function resolveSelectionDurations({
  businessId,
  selectionIds,
  employeeId,
  returnEmptyOnMissing = false,
}: ResolveOptions): Promise<ResolvedSelectionDuration[]> {
  const ids = [...new Set(selectionIds.filter(Boolean))]
  if (ids.length === 0) return []

  const subServices = await prisma.subService.findMany({
    where: {
      id: { in: ids },
      isActive: true,
      service: { businessId },
    },
    select: {
      id: true,
      duration: true,
      serviceId: true,
    },
  })

  const subIds = new Set(subServices.map((s) => s.id))
  const remaining = ids.filter((id) => !subIds.has(id))

  const services = remaining.length
    ? await prisma.service.findMany({
        where: { id: { in: remaining }, isActive: true, businessId },
        select: { id: true, duration: true },
      })
    : []

  const foundCount = subServices.length + services.length
  if (foundCount !== ids.length) {
    if (returnEmptyOnMissing) return []
    throw new Error('Servicio no encontrado')
  }

  const overrides =
    employeeId && ids.length > 0
      ? await prisma.employeeServiceDuration.findMany({
          where: {
            employeeId,
            OR: [
              { serviceId: { in: services.map((s) => s.id) } },
              { subServiceId: { in: subServices.map((s) => s.id) } },
            ],
          },
          select: { serviceId: true, subServiceId: true, duration: true },
        })
      : []

  const overrideByServiceId = new Map<string, number>()
  const overrideBySubServiceId = new Map<string, number>()
  for (const o of overrides) {
    if (o.serviceId) overrideByServiceId.set(o.serviceId, o.duration)
    if (o.subServiceId) overrideBySubServiceId.set(o.subServiceId, o.duration)
  }

  const result: ResolvedSelectionDuration[] = []
  for (const sub of subServices) {
    result.push({
      id: sub.id,
      kind: 'SUBSERVICE',
      baseServiceId: sub.serviceId,
      duration: overrideBySubServiceId.get(sub.id) ?? sub.duration,
    })
  }
  for (const svc of services) {
    result.push({
      id: svc.id,
      kind: 'SERVICE',
      baseServiceId: svc.id,
      duration: overrideByServiceId.get(svc.id) ?? svc.duration,
    })
  }

  return result
}

