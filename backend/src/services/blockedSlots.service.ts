import { prisma } from '../lib/prisma'
import type { CreateBlockedSlotInput, ListBlockedSlotsQuery } from '../lib/schemas'

export interface BlockedSlotListItem {
  id: string
  date: string
  startTime: string | null
  endTime: string | null
  type: string
  reason: string | null
  createdAt: Date
}

export class BlockedSlotNotFoundError extends Error {
  constructor(message: string = 'Bloqueo no encontrado o no pertenece a tu negocio') {
    super(message)
    this.name = 'BlockedSlotNotFoundError'
  }
}

export async function listBlockedSlotsService(
  businessId: string,
  query: ListBlockedSlotsQuery
): Promise<BlockedSlotListItem[]> {
  const where: { businessId: string; date?: { gte?: Date; lte?: Date } } = {
    businessId,
  }

  if (query.from || query.to) {
    const dateFilter: { gte?: Date; lte?: Date } = {}
    if (query.from) dateFilter.gte = new Date(query.from)
    if (query.to) {
      const toDate = new Date(query.to)
      toDate.setHours(23, 59, 59, 999)
      dateFilter.lte = toDate
    }
    where.date = dateFilter
  }

  const slots = await prisma.blockedSlot.findMany({
    where,
    orderBy: { date: 'asc' },
    select: {
      id: true,
      date: true,
      startTime: true,
      endTime: true,
      type: true,
      reason: true,
      createdAt: true,
    },
  })

  return slots.map((s) => ({
    id: s.id,
    date: s.date.toISOString().slice(0, 10),
    startTime: s.startTime,
    endTime: s.endTime,
    type: s.type,
    reason: s.reason,
    createdAt: s.createdAt,
  }))
}

export async function createBlockedSlotService(
  businessId: string,
  data: CreateBlockedSlotInput
) {
  // Use noon UTC so the calendar date is stored correctly in any server timezone
  const dateOnly = new Date(data.date + 'T12:00:00.000Z')

  const created = await prisma.blockedSlot.create({
    data: {
      businessId,
      date: dateOnly,
      type: data.type,
      startTime: data.type === 'TIME_SLOT' ? data.startTime! : null,
      endTime: data.type === 'TIME_SLOT' ? data.endTime! : null,
      reason: data.reason ?? null,
    },
    select: {
      id: true,
      date: true,
      startTime: true,
      endTime: true,
      type: true,
      reason: true,
      createdAt: true,
    },
  })

  return {
    id: created.id,
    date: created.date.toISOString().slice(0, 10),
    startTime: created.startTime,
    endTime: created.endTime,
    type: created.type,
    reason: created.reason,
    createdAt: created.createdAt,
  }
}

export async function deleteBlockedSlotService(
  id: string,
  businessId: string
): Promise<void> {
  const slot = await prisma.blockedSlot.findFirst({
    where: { id, businessId },
  })
  if (!slot) {
    throw new BlockedSlotNotFoundError('Bloqueo no encontrado o no pertenece a tu negocio')
  }
  await prisma.blockedSlot.delete({
    where: { id },
  })
}
