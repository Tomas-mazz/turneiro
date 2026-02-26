import { Response, NextFunction } from 'express'
import { getEmployeeIdByUserIdService } from '../services/employees.service'
import type { AuthRequest } from './auth'

export interface BusinessContext {
  businessId: string
  staffEmployeeId: string | null | undefined
}

export type BusinessContextRequest = AuthRequest & {
  businessContext: BusinessContext
}

/**
 * Must run after requireBusinessOwner. Ensures user has a business, resolves
 * staffEmployeeId for STAFF, and attaches businessContext to req.
 */
export async function requireBusinessContext(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const businessId = req.user?.businessId
  if (!businessId) {
    res.status(403).json({ error: 'No tienes un negocio asignado' })
    return
  }

  let staffEmployeeId: string | null | undefined
  if (req.user?.role === 'STAFF' && req.user?.userId) {
    staffEmployeeId = await getEmployeeIdByUserIdService(req.user.userId, businessId)
  } else {
    staffEmployeeId = undefined
  }

  ;(req as BusinessContextRequest).businessContext = { businessId, staffEmployeeId }
  next()
}
