import type { Response, NextFunction } from 'express'
import type { AuthRequest } from '../middleware/auth'
import { getBusinessContextOrRespond } from '../lib/requestGuards'
import {
  listEmployeeServiceDurationsForBusiness,
  upsertEmployeeServiceDurationsForBusiness,
  EmployeeServiceDurationError,
} from '../services/employeeServiceDurations.service'
import { upsertEmployeeServiceDurationsSchema } from '../lib/schemas'

export async function listOwnerEmployeeServiceDurations(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ctx = getBusinessContextOrRespond(req, res)
    if (!ctx) return
    const employeeId = String(req.params.id || '').trim()
    if (!employeeId) {
      res.status(400).json({ error: 'Empleado inválido' })
      return
    }
    const rows = await listEmployeeServiceDurationsForBusiness(ctx.businessId, employeeId)
    res.json(rows)
  } catch (err) {
    if (err instanceof EmployeeServiceDurationError) {
      res.status(400).json({ error: err.message })
      return
    }
    next(err)
  }
}

export async function upsertOwnerEmployeeServiceDurations(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ctx = getBusinessContextOrRespond(req, res)
    if (!ctx) return
    const employeeId = String(req.params.id || '').trim()
    if (!employeeId) {
      res.status(400).json({ error: 'Empleado inválido' })
      return
    }
    const parsed = upsertEmployeeServiceDurationsSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'Error de validación', details: parsed.error.errors })
      return
    }
    await upsertEmployeeServiceDurationsForBusiness(ctx.businessId, employeeId, parsed.data.items)
    res.json({ ok: true })
  } catch (err) {
    if (err instanceof EmployeeServiceDurationError) {
      res.status(400).json({ error: err.message })
      return
    }
    next(err)
  }
}

