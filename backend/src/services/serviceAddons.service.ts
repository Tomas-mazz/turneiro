import { prisma } from '../lib/prisma'
import { getBusinessCapabilities, IndustryCapabilityError } from '../lib/industryCapabilities'
import type { CreateServiceAddOnInput, UpdateServiceAddOnInput } from '../lib/schemas'

export class ServiceAddOnNotFoundError extends Error {
  constructor(message = 'Adicional no encontrado') {
    super(message)
    this.name = 'ServiceAddOnNotFoundError'
  }
}

export type ServiceAddOnAdminItem = {
  id: string
  name: string
  price: number
  isActive: boolean
  serviceIds: string[]
  subServiceIds: string[]
}

export type PublicServiceAddOnItem = {
  id: string
  name: string
  price: number
}

async function assertAllowServiceAddOns(businessId: string): Promise<void> {
  const caps = await getBusinessCapabilities(businessId)
  if (!caps.allowServiceAddOns) {
    throw new IndustryCapabilityError('Este rubro no permite configurar adicionales.')
  }
}

async function validateScopeBelongsToBusiness(
  businessId: string,
  serviceIds: string[],
  subServiceIds: string[]
): Promise<void> {
  if (serviceIds.length > 0) {
    const count = await prisma.service.count({
      where: { id: { in: serviceIds }, businessId },
    })
    if (count !== serviceIds.length) {
      throw new Error('Uno o más servicios no pertenecen al negocio')
    }
  }
  if (subServiceIds.length > 0) {
    const count = await prisma.subService.count({
      where: {
        id: { in: subServiceIds },
        service: { businessId },
      },
    })
    if (count !== subServiceIds.length) {
      throw new Error('Uno o más subservicios no pertenecen al negocio')
    }
  }
}

export async function listApplicableAddOnsForSelection(
  businessId: string,
  selectionId: string
): Promise<PublicServiceAddOnItem[]> {
  const caps = await getBusinessCapabilities(businessId)
  if (!caps.allowServiceAddOns) return []

  const sub = await prisma.subService.findFirst({
    where: { id: selectionId, service: { businessId } },
    select: { id: true, serviceId: true },
  })
  if (sub) {
    return prisma.serviceAddOn.findMany({
      where: {
        businessId,
        isActive: true,
        OR: [
          { serviceScopes: { some: { serviceId: sub.serviceId } } },
          { subServiceScopes: { some: { subServiceId: sub.id } } },
        ],
      },
      select: { id: true, name: true, price: true },
      orderBy: { name: 'asc' },
    })
  }

  const svc = await prisma.service.findFirst({
    where: { id: selectionId, businessId },
    select: { id: true },
  })
  if (!svc) return []

  return prisma.serviceAddOn.findMany({
    where: {
      businessId,
      isActive: true,
      serviceScopes: { some: { serviceId: svc.id } },
    },
    select: { id: true, name: true, price: true },
    orderBy: { name: 'asc' },
  })
}

export async function listServiceAddOnsForBusinessAdmin(
  businessId: string
): Promise<ServiceAddOnAdminItem[]> {
  const caps = await getBusinessCapabilities(businessId)
  if (!caps.allowServiceAddOns) return []

  const rows = await prisma.serviceAddOn.findMany({
    where: { businessId },
    orderBy: { name: 'asc' },
    include: {
      serviceScopes: { select: { serviceId: true } },
      subServiceScopes: { select: { subServiceId: true } },
    },
  })
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    price: r.price,
    isActive: r.isActive,
    serviceIds: r.serviceScopes.map((s) => s.serviceId),
    subServiceIds: r.subServiceScopes.map((s) => s.subServiceId),
  }))
}

export async function createServiceAddOnForBusiness(
  businessId: string,
  input: CreateServiceAddOnInput
): Promise<ServiceAddOnAdminItem> {
  await assertAllowServiceAddOns(businessId)
  await validateScopeBelongsToBusiness(businessId, input.serviceIds, input.subServiceIds)

  const created = await prisma.serviceAddOn.create({
    data: {
      businessId,
      name: input.name.trim(),
      price: input.price,
      isActive: input.isActive ?? true,
      serviceScopes: {
        create: input.serviceIds.map((serviceId) => ({ serviceId })),
      },
      subServiceScopes: {
        create: input.subServiceIds.map((subServiceId) => ({ subServiceId })),
      },
    },
    include: {
      serviceScopes: { select: { serviceId: true } },
      subServiceScopes: { select: { subServiceId: true } },
    },
  })
  return {
    id: created.id,
    name: created.name,
    price: created.price,
    isActive: created.isActive,
    serviceIds: created.serviceScopes.map((s) => s.serviceId),
    subServiceIds: created.subServiceScopes.map((s) => s.subServiceId),
  }
}

export async function updateServiceAddOnForBusiness(
  businessId: string,
  addOnId: string,
  input: UpdateServiceAddOnInput
): Promise<ServiceAddOnAdminItem> {
  await assertAllowServiceAddOns(businessId)
  const existing = await prisma.serviceAddOn.findFirst({
    where: { id: addOnId, businessId },
  })
  if (!existing) throw new ServiceAddOnNotFoundError()

  if (input.serviceIds !== undefined || input.subServiceIds !== undefined) {
    const nextServices = input.serviceIds ?? (
      await prisma.serviceAddOnService.findMany({
        where: { serviceAddOnId: addOnId },
        select: { serviceId: true },
      })
    ).map((x) => x.serviceId)
    const nextSubs =
      input.subServiceIds ??
      (
        await prisma.serviceAddOnSubService.findMany({
          where: { serviceAddOnId: addOnId },
          select: { subServiceId: true },
        })
      ).map((x) => x.subServiceId)
    await validateScopeBelongsToBusiness(businessId, nextServices, nextSubs)
  }

  await prisma.$transaction(async (tx) => {
    if (input.serviceIds !== undefined) {
      await tx.serviceAddOnService.deleteMany({ where: { serviceAddOnId: addOnId } })
      await tx.serviceAddOnService.createMany({
        data: input.serviceIds.map((serviceId) => ({ serviceAddOnId: addOnId, serviceId })),
      })
    }
    if (input.subServiceIds !== undefined) {
      await tx.serviceAddOnSubService.deleteMany({ where: { serviceAddOnId: addOnId } })
      await tx.serviceAddOnSubService.createMany({
        data: input.subServiceIds.map((subServiceId) => ({
          serviceAddOnId: addOnId,
          subServiceId,
        })),
      })
    }
    await tx.serviceAddOn.update({
      where: { id: addOnId },
      data: {
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.price !== undefined && { price: input.price }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    })
  })

  const updated = await prisma.serviceAddOn.findFirstOrThrow({
    where: { id: addOnId, businessId },
    include: {
      serviceScopes: { select: { serviceId: true } },
      subServiceScopes: { select: { subServiceId: true } },
    },
  })
  return {
    id: updated.id,
    name: updated.name,
    price: updated.price,
    isActive: updated.isActive,
    serviceIds: updated.serviceScopes.map((s) => s.serviceId),
    subServiceIds: updated.subServiceScopes.map((s) => s.subServiceId),
  }
}

export async function deleteServiceAddOnForBusiness(
  businessId: string,
  addOnId: string
): Promise<void> {
  await assertAllowServiceAddOns(businessId)
  const existing = await prisma.serviceAddOn.findFirst({
    where: { id: addOnId, businessId },
  })
  if (!existing) throw new ServiceAddOnNotFoundError()
  await prisma.serviceAddOn.delete({ where: { id: addOnId } })
}

export type ResolvedAddOnLine = {
  serviceAddOnId: string
  nameSnapshot: string
  priceSnapshot: number
}

/**
 * Validates each id is an active add-on for this business and applicable to the booking selection id.
 */
export async function resolveAddOnLinesForAppointment(
  businessId: string,
  selectionId: string,
  addOnIds: string[]
): Promise<ResolvedAddOnLine[]> {
  const caps = await getBusinessCapabilities(businessId)
  if (!caps.allowServiceAddOns) {
    throw new Error('Adicionales no disponibles para este negocio')
  }
  const uniqueIds = [...new Set(addOnIds)]
  if (uniqueIds.length === 0) return []

  const applicable = await listApplicableAddOnsForSelection(businessId, selectionId)
  const applicableSet = new Set(applicable.map((a) => a.id))

  const rows = await prisma.serviceAddOn.findMany({
    where: {
      id: { in: uniqueIds },
      businessId,
      isActive: true,
    },
    select: { id: true, name: true, price: true },
  })
  const byId = new Map(rows.map((r) => [r.id, r]))

  const lines: ResolvedAddOnLine[] = []
  for (const id of uniqueIds) {
    if (!applicableSet.has(id)) {
      throw new Error('Uno o más adicionales no aplican a este servicio')
    }
    const row = byId.get(id)
    if (!row) {
      throw new Error('Adicional inválido o inactivo')
    }
    lines.push({
      serviceAddOnId: row.id,
      nameSnapshot: row.name,
      priceSnapshot: row.price,
    })
  }
  return lines
}
