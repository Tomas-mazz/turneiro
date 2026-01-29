import crypto from 'crypto'
import { prisma } from '../lib/prisma'
import { getAvailabilityService } from './availability.service'
import type { CreateAppointmentInput } from '../lib/schemas'

export class SlotUnavailableError extends Error {
  constructor(message: string = 'El horario ya no está disponible') {
    super(message)
    this.name = 'SlotUnavailableError'
  }
}

export class CancellationNotAllowedError extends Error {
  constructor(message: string = 'No se puede cancelar') {
    super(message)
    this.name = 'CancellationNotAllowedError'
  }
}

export async function createAppointmentService(data: CreateAppointmentInput) {
  const business = await prisma.business.findUnique({
    where: { slug: data.businessSlug },
    include: {
      services: { where: { id: data.serviceId, isActive: true } },
    },
  })

  if (!business) {
    throw new SlotUnavailableError('Negocio no encontrado')
  }

  const service = business.services[0]
  if (!service) {
    throw new SlotUnavailableError('Servicio no encontrado')
  }

  const date = new Date(data.date + 'T12:00:00')
  const slots = await getAvailabilityService(
    data.businessSlug,
    data.serviceId,
    date
  )

  if (!slots.includes(data.slotTime)) {
    throw new SlotUnavailableError('El horario ya no está disponible')
  }

  const [hours, minutes] = data.slotTime.split(':').map(Number)
  const startTime = new Date(date)
  startTime.setHours(hours, minutes, 0, 0)
  const endTime = new Date(startTime.getTime() + service.duration * 60 * 1000)

  const cancellationToken = crypto.randomBytes(32).toString('hex')

  const appointment = await prisma.appointment.create({
    data: {
      businessId: business.id,
      serviceId: service.id,
      startTime,
      endTime,
      serviceName: service.name,
      price: service.price,
      paymentStatus: 'PENDING',
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      status: 'UPCOMING',
      cancellationToken,
    },
  })

  return {
    id: appointment.id,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    serviceName: appointment.serviceName,
    price: appointment.price,
    status: appointment.status,
    cancellationToken: appointment.cancellationToken,
  }
}

export async function cancelAppointmentService(token: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { cancellationToken: token },
    include: { business: { include: { settings: true } } },
  })

  if (!appointment) {
    throw new CancellationNotAllowedError('Cita no encontrada')
  }

  if (appointment.status === 'CANCELLED') {
    throw new CancellationNotAllowedError('La cita ya fue cancelada')
  }

  const windowHours = appointment.business.settings?.freeCancellationWindow ?? 24
  const cutoff = new Date(appointment.startTime.getTime() - windowHours * 60 * 60 * 1000)

  if (new Date() > cutoff) {
    throw new CancellationNotAllowedError(
      `Debes cancelar al menos ${windowHours} horas antes de la cita`
    )
  }

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: 'CANCELLED' },
  })

  return { cancelled: true, id: appointment.id }
}

export interface AppointmentListItem {
  id: string
  startTime: Date
  endTime: Date
  serviceName: string
  price: number
  clientName: string
  clientPhone: string
  status: string
  paymentStatus: string
}

export async function getAppointmentsService(
  businessId: string
): Promise<AppointmentListItem[]> {
  const appointments = await prisma.appointment.findMany({
    where: { businessId },
    orderBy: { startTime: 'desc' },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      serviceName: true,
      price: true,
      clientName: true,
      clientPhone: true,
      status: true,
      paymentStatus: true,
    },
  })
  return appointments
}

export async function cancelAppointmentByOwnerService(
  appointmentId: string,
  businessId: string,
  reason: string
) {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, businessId },
  })
  if (!appointment) {
    throw new CancellationNotAllowedError('Cita no encontrada o no pertenece a tu negocio')
  }
  if (appointment.status === 'CANCELLED') {
    throw new CancellationNotAllowedError('La cita ya fue cancelada')
  }
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: 'CANCELLED', cancellationReason: reason },
  })
  return { cancelled: true, id: appointment.id }
}
