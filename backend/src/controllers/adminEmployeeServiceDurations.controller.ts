import type { Response, NextFunction } from 'express'
import type { AuthRequest } from '../middleware/auth'
import type { AdminBusinessIdRequest } from '../middleware/adminBusinessId'
import {
  listEmployeeServiceDurationsForBusiness,
  upsertEmployeeServiceDurationsForBusiness,
  EmployeeServiceDurationError,
} from '../services/employeeServiceDurations.service'
import { upsertEmployeeServiceDurationsSchema } from '../lib/schemas'

export async function adminListEmployeeServiceDurations(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const businessId = (req as AdminBusinessIdRequest).businessId
    const employeeId = String(req.params.employeeId || '').trim()
    if (!employeeId) {
      res.status(400).json({ error: 'Empleado inválido' })
      return
    }
    const rows = await listEmployeeServiceDurationsForBusiness(businessId, employeeId)
    res.json(rows)
  } catch (err) {
    if (err instanceof EmployeeServiceDurationError) {
      res.status(400).json({ error: err.message })
      return
    }
    next(err)
  }
}

export async function adminUpsertEmployeeServiceDurations(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const businessId = (req as AdminBusinessIdRequest).businessId
    const employeeId = String(req.params.employeeId || '').trim()
    if (!employeeId) {
      res.status(400).json({ error: 'Empleado inválido' })
      return
    }
    const parsed = upsertEmployeeServiceDurationsSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'Error de validación', details: parsed.error.errors })
      return
    }
    await upsertEmployeeServiceDurationsForBusiness(businessId, employeeId, parsed.data.items)
    res.json({ ok: true })
  } catch (err) {
    if (err instanceof EmployeeServiceDurationError) {
      res.status(400).json({ error: err.message })
      return
    }
    next(err)
  }
}

