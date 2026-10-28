import type { Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import type { AuthRequest } from '../middleware/auth'
import { getBusinessContextOrRespond } from '../lib/requestGuards'
import {
  EmployeeNotInBusinessError,
  getEmployeeWorkingHours,
  getWorkingHoursForBusiness,
  replaceEmployeeWorkingHours,
  resetEmployeeWorkingHours,
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


/** Owner dashboard: one employee's schedule (GET), set it (PUT, body validated by the route) or reset it (DELETE). */
export async function getOwnerEmployeeWorkingHours(req: AuthRequest, res: Response, next: NextFunction) {
  return handleEmployeeHours(req, res, next, (businessId, employeeId) =>
    getEmployeeWorkingHours(businessId, employeeId)
  )
}

export async function updateOwnerEmployeeWorkingHours(req: AuthRequest, res: Response, next: NextFunction) {
  return handleEmployeeHours(req, res, next, (businessId, employeeId) =>
    replaceEmployeeWorkingHours(businessId, employeeId, req.body.hours)
  )
}

export async function resetOwnerEmployeeWorkingHours(req: AuthRequest, res: Response, next: NextFunction) {
  return handleEmployeeHours(req, res, next, (businessId, employeeId) =>
    resetEmployeeWorkingHours(businessId, employeeId)
  )
}

async function handleEmployeeHours(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
  run: (businessId: string, employeeId: string) => Promise<unknown>
) {
  try {
    const ctx = getBusinessContextOrRespond(req, res)
    if (!ctx) return
    const employeeId = String(req.params.id || '').trim()
    if (!employeeId) return res.status(400).json({ error: 'Empleado inválido' })
    return res.json(await run(ctx.businessId, employeeId))
  } catch (err) {
    if (err instanceof EmployeeNotInBusinessError) return res.status(404).json({ error: err.message })
    next(err)
  }
}
