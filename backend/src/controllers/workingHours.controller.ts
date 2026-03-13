import type { Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import type { AuthRequest } from '../middleware/auth'
import { getBusinessContextOrRespond } from '../lib/requestGuards'
import {
  getWorkingHoursForBusiness,
  upsertWorkingHoursForBusiness,
} from '../services/workingHours.service'
import { updateWorkingHoursSchema } from '../lib/schemas'

export async function getMyWorkingHours(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ctx = getBusinessContextOrRespond(req, res)
    if (!ctx) return
    const { businessId } = ctx

    const hours = await getWorkingHoursForBusiness(businessId)
    return res.json(hours)
  } catch (err) {
    next(err)
  }
}

export async function updateMyWorkingHours(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (req.user?.role !== 'OWNER' && req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Solo el dueño o un administrador en contexto de tienda puede actualizar horarios.',
      })
    }

    const ctx = getBusinessContextOrRespond(req, res)
    if (!ctx) return
    const { businessId } = ctx

    const parsed = updateWorkingHoursSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Error de validación',
        details: (parsed.error as ZodError).errors,
      })
    }

    const updated = await upsertWorkingHoursForBusiness(businessId, parsed.data.hours)
    return res.json(updated)
  } catch (err) {
    next(err)
  }
}

