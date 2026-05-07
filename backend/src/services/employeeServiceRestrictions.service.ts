import { prisma } from '../lib/prisma'
import { resolveSelectionDurations } from './selectionDurations.service'

export class EmployeeServiceRestrictionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EmployeeServiceRestrictionError'
  }
}

async function assertEmployeeBelongsToBusiness(employeeId: string, businessId: string) {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, businessId },
    select: { id: true },
  })
  if (!employee) throw new EmployeeServiceRestrictionError('Empleado no encontrado')
}

/**
 * Returns true when the employee can perform ALL selections.
 * Default: allowed unless a restriction row exists.
 */
export async function employeeCanPerformSelections(params: {
  businessId: string
  employeeId: string
  selectionIds: string[]
  /**
   * Mirrors resolveSelectionDurations behavior: when true, return false if any id is missing/invalid.
   * Useful for availability (silently empty).
   */
  returnFalseOnMissing?: boolean
}): Promise<boolean> {
  const { businessId, employeeId } = params
  const ids = [...new Set((params.selectionIds ?? []).filter(Boolean))]
  if (ids.length === 0) return false

  // Validate selections belong to business and classify them using the existing resolver.
  const resolved = await resolveSelectionDurations({
    businessId,
    selectionIds: ids,
    returnEmptyOnMissing: !!params.returnFalseOnMissing,
  }).catch((err) => {
    if (params.returnFalseOnMissing) return [] as Awaited<ReturnType<typeof resolveSelectionDurations>>
    throw err
  })

  if (resolved.length !== ids.length) return false

  const serviceIds = resolved.filter((r) => r.kind === 'SERVICE').map((r) => r.id)
  const subServiceIds = resolved.filter((r) => r.kind === 'SUBSERVICE').map((r) => r.id)

  const restricted = await prisma.employeeServiceRestriction.findFirst({
    where: {
      employeeId,
      OR: [
        serviceIds.length > 0 ? { serviceId: { in: serviceIds } } : undefined,
        subServiceIds.length > 0 ? { subServiceId: { in: subServiceIds } } : undefined,
      ].filter(Boolean) as any,
    },
    select: { id: true },
  })

  return !restricted
}

export type EmployeeServiceRestrictionRow = {
  id: string
  employeeId: string
  serviceId: string | null
  subServiceId: string | null
}

export async function listEmployeeServiceRestrictionsForBusiness(
  businessId: string,
  employeeId: string
): Promise<EmployeeServiceRestrictionRow[]> {
  await assertEmployeeBelongsToBusiness(employeeId, businessId)
  const rows = await prisma.employeeServiceRestriction.findMany({
    where: { employeeId, employee: { businessId } },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, employeeId: true, serviceId: true, subServiceId: true },
  })
  return rows
}

export type UpsertEmployeeServiceRestrictionsInput = {
  /** Disabled selections only (absence = allowed). */
  disabled: Array<{ serviceId?: string; subServiceId?: string }>
}

async function assertSelectionsBelongToBusiness(
  businessId: string,
  serviceIds: string[],
  subServiceIds: string[]
) {
  if (serviceIds.length > 0) {
    const count = await prisma.service.count({
      where: { id: { in: serviceIds }, businessId },
    })
    if (count !== serviceIds.length) {
      throw new EmployeeServiceRestrictionError('Servicio inválido para este negocio')
    }
  }
  if (subServiceIds.length > 0) {
    const count = await prisma.subService.count({
      where: { id: { in: subServiceIds }, service: { businessId } },
    })
    if (count !== subServiceIds.length) {
      throw new EmployeeServiceRestrictionError('Subservicio inválido para este negocio')
    }
  }
}

export async function replaceEmployeeServiceRestrictionsForBusiness(
  businessId: string,
  employeeId: string,
  input: UpsertEmployeeServiceRestrictionsInput
): Promise<void> {
  await assertEmployeeBelongsToBusiness(employeeId, businessId)
  const disabled = Array.isArray(input.disabled) ? input.disabled : []

  const serviceIds = [
    ...new Set(disabled.map((x) => x.serviceId).filter(Boolean) as string[]),
  ]
  const subServiceIds = [
    ...new Set(disabled.map((x) => x.subServiceId).filter(Boolean) as string[]),
  ]
  await assertSelectionsBelongToBusiness(businessId, serviceIds, subServiceIds)

  await prisma.$transaction(async (tx) => {
    await tx.employeeServiceRestriction.deleteMany({ where: { employeeId } })
    if (disabled.length === 0) return

    // Create disabled rows (deduped by unique constraints).
    for (const item of disabled) {
      const hasService = typeof item.serviceId === 'string' && item.serviceId.length > 0
      const hasSub = typeof item.subServiceId === 'string' && item.subServiceId.length > 0
      if (hasService === hasSub) {
        throw new EmployeeServiceRestrictionError('Debe enviar serviceId o subServiceId (solo uno)')
      }
      if (hasService) {
        await tx.employeeServiceRestriction.create({
          data: { employeeId, serviceId: item.serviceId! },
        })
      } else {
        await tx.employeeServiceRestriction.create({
          data: { employeeId, subServiceId: item.subServiceId! },
        })
      }
    }
  })
}

