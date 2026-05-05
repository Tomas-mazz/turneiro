import { prisma } from '../lib/prisma'

export type EmployeeServiceDurationRow = {
  id: string
  employeeId: string
  serviceId: string | null
  subServiceId: string | null
  duration: number
}

export type UpsertEmployeeServiceDurationItem = {
  serviceId?: string
  subServiceId?: string
  /** null means "clear override" */
  duration: number | null
}

export class EmployeeServiceDurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EmployeeServiceDurationError'
  }
}

async function assertEmployeeBelongsToBusiness(employeeId: string, businessId: string) {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, businessId },
    select: { id: true },
  })
  if (!employee) throw new EmployeeServiceDurationError('Empleado no encontrado')
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
      throw new EmployeeServiceDurationError('Servicio inválido para este negocio')
    }
  }
  if (subServiceIds.length > 0) {
    const count = await prisma.subService.count({
      where: { id: { in: subServiceIds }, service: { businessId } },
    })
    if (count !== subServiceIds.length) {
      throw new EmployeeServiceDurationError('Subservicio inválido para este negocio')
    }
  }
}

export async function listEmployeeServiceDurationsForBusiness(
  businessId: string,
  employeeId: string
): Promise<EmployeeServiceDurationRow[]> {
  await assertEmployeeBelongsToBusiness(employeeId, businessId)
  const rows = await prisma.employeeServiceDuration.findMany({
    where: {
      employeeId,
      employee: { businessId },
    },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      employeeId: true,
      serviceId: true,
      subServiceId: true,
      duration: true,
    },
  })
  return rows
}

export async function upsertEmployeeServiceDurationsForBusiness(
  businessId: string,
  employeeId: string,
  items: UpsertEmployeeServiceDurationItem[]
): Promise<void> {
  await assertEmployeeBelongsToBusiness(employeeId, businessId)

  const serviceIds = [...new Set(items.map((i) => i.serviceId).filter(Boolean) as string[])]
  const subServiceIds = [...new Set(items.map((i) => i.subServiceId).filter(Boolean) as string[])]
  await assertSelectionsBelongToBusiness(businessId, serviceIds, subServiceIds)

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const hasService = typeof item.serviceId === 'string' && item.serviceId.length > 0
      const hasSub = typeof item.subServiceId === 'string' && item.subServiceId.length > 0
      if (hasService === hasSub) {
        throw new EmployeeServiceDurationError('Debe enviar serviceId o subServiceId (solo uno)')
      }

      if (item.duration === null) {
        await tx.employeeServiceDuration.deleteMany({
          where: {
            employeeId,
            ...(hasService ? { serviceId: item.serviceId! } : { subServiceId: item.subServiceId! }),
          },
        })
        continue
      }

      if (!Number.isFinite(item.duration) || item.duration < 5 || item.duration > 600) {
        throw new EmployeeServiceDurationError('Duración inválida')
      }

      if (hasService) {
        await tx.employeeServiceDuration.upsert({
          where: {
            employeeId_serviceId: {
              employeeId,
              serviceId: item.serviceId!,
            },
          },
          create: {
            employeeId,
            serviceId: item.serviceId!,
            duration: item.duration,
          },
          update: { duration: item.duration },
        })
      } else {
        await tx.employeeServiceDuration.upsert({
          where: {
            employeeId_subServiceId: {
              employeeId,
              subServiceId: item.subServiceId!,
            },
          },
          create: {
            employeeId,
            subServiceId: item.subServiceId!,
            duration: item.duration,
          },
          update: { duration: item.duration },
        })
      }
    }
  })
}

