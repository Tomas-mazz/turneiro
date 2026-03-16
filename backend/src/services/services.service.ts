import { prisma } from '../lib/prisma'
import type {
  UpdateServiceInput,
  CreateServiceAdminInput,
  UpdateServiceAdminInput,
  CreateSubServiceAdminInput,
  UpdateSubServiceAdminInput,
} from '../lib/schemas'

export interface ServiceListItem {
  id: string
  name: string
  price: number
  duration: number
  isActive: boolean
}

export async function getServicesForBusinessService(
  businessId: string
): Promise<ServiceListItem[]> {
  const services = await prisma.service.findMany({
    where: { businessId },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      price: true,
      duration: true,
      isActive: true,
    },
  })
  return services
}

export class ServiceNotFoundError extends Error {
  constructor(message: string = 'Servicio no encontrado') {
    super(message)
    this.name = 'ServiceNotFoundError'
  }
}

export class SubServiceNotFoundError extends Error {
  constructor(message: string = 'Subservicio no encontrado') {
    super(message)
    this.name = 'SubServiceNotFoundError'
  }
}

export async function updateServicePriceAndDurationService(
  serviceId: string,
  businessId: string,
  data: UpdateServiceInput
) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, businessId },
  })
  if (!service) {
    throw new ServiceNotFoundError('Servicio no encontrado o no pertenece a tu negocio')
  }
  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: {
      ...(data.price !== undefined && { price: data.price }),
      ...(data.duration !== undefined && { duration: data.duration }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    select: {
      id: true,
      name: true,
      price: true,
      duration: true,
      isActive: true,
    },
  })
  return updated
}

export async function createServiceForAdmin(
  businessId: string,
  data: CreateServiceAdminInput
): Promise<ServiceListItem> {
  const service = await prisma.service.create({
    data: {
      businessId,
      name: data.name.trim(),
      price: data.price,
      duration: data.duration,
      isActive: data.isActive ?? true,
    },
    select: {
      id: true,
      name: true,
      price: true,
      duration: true,
      isActive: true,
    },
  })
  return service
}

/**
 * Owner/staff dashboard: create service scoped to current business.
 * Reuses the same input rules as admin create.
 */
export async function createServiceForBusiness(
  businessId: string,
  data: CreateServiceAdminInput
): Promise<ServiceListItem> {
  return createServiceForAdmin(businessId, data)
}

export async function updateServiceForAdmin(
  serviceId: string,
  data: UpdateServiceAdminInput
): Promise<ServiceListItem> {
  const existing = await prisma.service.findUnique({
    where: { id: serviceId },
  })
  if (!existing) {
    throw new ServiceNotFoundError('Servicio no encontrado')
  }
  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.duration !== undefined && { duration: data.duration }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    select: {
      id: true,
      name: true,
      price: true,
      duration: true,
      isActive: true,
    },
  })
  return updated
}

export async function deleteServiceForAdmin(serviceId: string): Promise<void> {
  const existing = await prisma.service.findUnique({
    where: { id: serviceId },
  })
  if (!existing) {
    throw new ServiceNotFoundError('Servicio no encontrado')
  }
  await prisma.service.delete({
    where: { id: serviceId },
  })
}

/**
 * Owner dashboard: delete a service that belongs to the current business.
 */
export async function deleteServiceForBusiness(
  serviceId: string,
  businessId: string
): Promise<void> {
  const existing = await prisma.service.findFirst({
    where: { id: serviceId, businessId },
  })
  if (!existing) {
    throw new ServiceNotFoundError('Servicio no encontrado o no pertenece a tu negocio')
  }
  await prisma.service.delete({
    where: { id: serviceId },
  })
}

export interface SubServiceListItem {
  id: string
  name: string
  price: number
  duration: number
  isActive: boolean
  shortDescription: string | null
  description: string | null
}

export async function getSubServicesForServiceAdmin(
  serviceId: string
): Promise<SubServiceListItem[]> {
  const subServices = await prisma.subService.findMany({
    where: { serviceId },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      price: true,
      duration: true,
      isActive: true,
      shortDescription: true,
      description: true,
    },
  })
  return subServices
}

export async function createSubServiceForAdmin(
  serviceId: string,
  data: CreateSubServiceAdminInput
): Promise<SubServiceListItem> {
  // Ensure parent service exists
  const parent = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { id: true },
  })
  if (!parent) {
    throw new ServiceNotFoundError('Servicio padre no encontrado')
  }

  const sub = await prisma.subService.create({
    data: {
      serviceId,
      name: data.name.trim(),
      price: data.price,
      duration: data.duration,
      isActive: data.isActive ?? true,
      shortDescription: data.shortDescription ?? null,
      description: data.description ?? null,
    },
    select: {
      id: true,
      name: true,
      price: true,
      duration: true,
      isActive: true,
      shortDescription: true,
      description: true,
    },
  })
  return sub
}

export async function updateSubServiceForAdmin(
  subServiceId: string,
  data: UpdateSubServiceAdminInput
): Promise<SubServiceListItem> {
  const existing = await prisma.subService.findUnique({
    where: { id: subServiceId },
  })
  if (!existing) {
    throw new SubServiceNotFoundError('Subservicio no encontrado')
  }
  const updated = await prisma.subService.update({
    where: { id: subServiceId },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.duration !== undefined && { duration: data.duration }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.shortDescription !== undefined && { shortDescription: data.shortDescription ?? null }),
      ...(data.description !== undefined && { description: data.description ?? null }),
    },
    select: {
      id: true,
      name: true,
      price: true,
      duration: true,
      isActive: true,
      shortDescription: true,
      description: true,
    },
  })
  return updated
}

export async function deleteSubServiceForAdmin(subServiceId: string): Promise<void> {
  const existing = await prisma.subService.findUnique({
    where: { id: subServiceId },
  })
  if (!existing) {
    throw new SubServiceNotFoundError('Subservicio no encontrado')
  }
  await prisma.subService.delete({
    where: { id: subServiceId },
  })
}
