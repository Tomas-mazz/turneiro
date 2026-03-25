import { Response, NextFunction } from 'express'
import type { AuthRequest } from './auth'

export type AdminBusinessIdRequest = AuthRequest & {
  businessId: string
}

/**
 * For admin routes under /businesses/:id/... where :id is the businessId.
 * Validates req.params.id and attaches it as req.businessId. Responds 400 if missing.
 */
export function requireAdminBusinessId(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const businessId = req.params.id
  if (!businessId) {
    res.status(400).json({ error: 'ID de negocio obligatorio' })
    return
  }
  (req as AdminBusinessIdRequest).businessId = businessId
  next()
}
