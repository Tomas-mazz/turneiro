import type { Response } from 'express'
import type { AuthRequest } from '../middleware/auth'
import type { BusinessContext } from '../middleware/businessContext'

/**
 * Validates req.businessContext and returns it, or sends 403 and returns undefined.
 * Use in owner/staff dashboard controllers that run after requireBusinessContext middleware.
 */
export function getBusinessContextOrRespond(
  req: AuthRequest,
  res: Response
): BusinessContext | undefined {
  if (!req.businessContext) {
    res.status(403).json({ error: 'No tienes un negocio asignado' })
    return undefined
  }
  return req.businessContext
}

/**
 * Validates req.businessId and returns it, or sends 400 and returns undefined.
 * Use in admin controllers that run after requireAdminBusinessId middleware.
 */
export function getAdminBusinessIdOrRespond(
  req: AuthRequest,
  res: Response
): string | undefined {
  if (!req.businessId) {
    res.status(400).json({ error: 'ID de negocio obligatorio' })
    return undefined
  }
  return req.businessId
}
