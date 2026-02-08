import { prisma } from '../lib/prisma'
import type { UpdateServiceInput, CreateServiceAdminInput, UpdateServiceAdminInput } from '../lib/schemas'

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
