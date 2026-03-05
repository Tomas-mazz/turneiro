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
  const { businessId, staffEmployeeId } = ctx
  const parsed = listBlockedSlotsQuerySchema.safeParse(req.query)
  const query = parsed.success ? parsed.data : {}

  const slots = await listBlockedSlotsService(
    businessId,
    query,
    // When there is an associated employee (staff or owner), return global
    // blocks plus that employee's personal blocks.
    staffEmployeeId ?? undefined
  )
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
    const { businessId, staffEmployeeId } = ctx
    const parsed = createBlockedSlotSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Error de validación',
        details: (parsed.error as ZodError).errors,
      })
    }

    const isStaff = req.user?.role === 'STAFF'
    const isOwner = req.user?.role === 'OWNER'
    const scope = parsed.data.scope

    // STAFF: blocks always apply only to their own calendar.
    // OWNER: can choose scope SELF (only their calendar) when an owner-employee exists,
    // otherwise falls back to business-wide blocks.
    const shouldUseEmployeeId =
      (isStaff && !!staffEmployeeId) || (isOwner && scope === 'SELF' && !!staffEmployeeId)

    const created = await createBlockedSlotService(
      businessId,
      parsed.data,
      shouldUseEmployeeId ? staffEmployeeId ?? null : null
    )
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
