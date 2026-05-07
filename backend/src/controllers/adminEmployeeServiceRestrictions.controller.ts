import type { Response, NextFunction } from 'express'
import type { AuthRequest } from '../middleware/auth'
import type { AdminBusinessIdRequest } from '../middleware/adminBusinessId'
import {
  EmployeeServiceRestrictionError,
  listEmployeeServiceRestrictionsForBusiness,
  replaceEmployeeServiceRestrictionsForBusiness,
} from '../services/employeeServiceRestrictions.service'
import { replaceEmployeeServiceRestrictionsSchema } from '../lib/schemas'

export async function adminListEmployeeServiceRestrictions(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const businessId = (req as AdminBusinessIdRequest).businessId
    const employeeId = String(req.params.employeeId || '').trim()
    if (!employeeId) {
      res.status(400).json({ error: 'Empleado inválido' })
      return
    }
    const rows = await listEmployeeServiceRestrictionsForBusiness(businessId, employeeId)
    res.json(rows)
  } catch (err) {
    if (err instanceof EmployeeServiceRestrictionError) {
      res.status(400).json({ error: err.message })
      return
    }
    next(err)
  }
}

export async function adminReplaceEmployeeServiceRestrictions(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const businessId = (req as AdminBusinessIdRequest).businessId
    const employeeId = String(req.params.employeeId || '').trim()
    if (!employeeId) {
      res.status(400).json({ error: 'Empleado inválido' })
      return
    }
    const parsed = replaceEmployeeServiceRestrictionsSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'Error de validación', details: parsed.error.errors })
      return
    }
    await replaceEmployeeServiceRestrictionsForBusiness(businessId, employeeId, parsed.data)
    res.json({ ok: true })
  } catch (err) {
    if (err instanceof EmployeeServiceRestrictionError) {
      res.status(400).json({ error: err.message })
      return
    }
    next(err)
  }
}

