import type { Response, NextFunction } from 'express'
import type { AuthRequest } from '../middleware/auth'
import { getBusinessContextOrRespond } from '../lib/requestGuards'
import {
  EmployeeServiceRestrictionError,
  listEmployeeServiceRestrictionsForBusiness,
  replaceEmployeeServiceRestrictionsForBusiness,
} from '../services/employeeServiceRestrictions.service'
import { replaceEmployeeServiceRestrictionsSchema } from '../lib/schemas'

export async function listOwnerEmployeeServiceRestrictions(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const ctx = getBusinessContextOrRespond(req, res)
    if (!ctx) return
    const employeeId = String(req.params.id || '').trim()
    if (!employeeId) {
      res.status(400).json({ error: 'Empleado inválido' })
      return
    }
    const rows = await listEmployeeServiceRestrictionsForBusiness(ctx.businessId, employeeId)
    res.json(rows)
  } catch (err) {
    if (err instanceof EmployeeServiceRestrictionError) {
      res.status(400).json({ error: err.message })
      return
    }
    next(err)
  }
}

export async function replaceOwnerEmployeeServiceRestrictions(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const ctx = getBusinessContextOrRespond(req, res)
    if (!ctx) return
    const employeeId = String(req.params.id || '').trim()
    if (!employeeId) {
      res.status(400).json({ error: 'Empleado inválido' })
      return
    }
    const parsed = replaceEmployeeServiceRestrictionsSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'Error de validación', details: parsed.error.errors })
      return
    }
    await replaceEmployeeServiceRestrictionsForBusiness(ctx.businessId, employeeId, parsed.data)
    res.json({ ok: true })
  } catch (err) {
    if (err instanceof EmployeeServiceRestrictionError) {
      res.status(400).json({ error: err.message })
      return
    }
    next(err)
  }
}

