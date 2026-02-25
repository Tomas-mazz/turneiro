import { Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import {
  listBlockedSlotsService,
  createBlockedSlotService,
  deleteBlockedSlotService,
  BlockedSlotNotFoundError,
} from '../services/blockedSlots.service'
import { createBlockedSlotSchema, listBlockedSlotsQuerySchema } from '../lib/schemas'
import type { AuthRequest } from '../middleware/auth'
import { getBusinessContextOrRespond } from '../lib/requestGuards'

export async function getBlockedSlots(req: AuthRequest, res: Response) {
  const ctx = getBusinessContextOrRespond(req, res)
  if (!ctx) return
  const { businessId } = ctx
  const parsed = listBlockedSlotsQuerySchema.safeParse(req.query)
  const query = parsed.success ? parsed.data : {}

  const slots = await listBlockedSlotsService(businessId, query)
  return res.json(slots)
}

export async function createBlockedSlot(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const ctx = getBusinessContextOrRespond(req, res)
    if (!ctx) return
    const { businessId } = ctx
    const parsed = createBlockedSlotSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Error de validación',
        details: (parsed.error as ZodError).errors,
      })
    }

    const created = await createBlockedSlotService(businessId, parsed.data)
    return res.status(201).json(created)
  } catch (err) {
    next(err)
  }
}

export async function deleteBlockedSlot(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const ctx = getBusinessContextOrRespond(req, res)
    if (!ctx) return
    const { businessId } = ctx
    const id = req.params.id
    if (!id) {
      return res.status(400).json({ error: 'ID de bloqueo requerido' })
    }

    await deleteBlockedSlotService(id, businessId)
    return res.status(204).send()
  } catch (err) {
    if (err instanceof BlockedSlotNotFoundError) {
      return res.status(404).json({ error: err.message })
    }
    next(err)
  }
}
