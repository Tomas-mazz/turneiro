import { Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import {
  getEmployeeIdByUserIdService,
  getOwnerEmployeeIdForBusinessService,
} from '../services/employees.service'
import type { AuthRequest } from './auth'

export const ADMIN_ACTING_AS_SLUG_HEADER = 'x-admin-acting-as-slug'

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
 * ADMIN must send X-Admin-Acting-As-Slug (store subdomain) to act on that business.
 */
export async function requireBusinessContext(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (req.user?.role === 'ADMIN') {
    const slug = String(req.headers[ADMIN_ACTING_AS_SLUG_HEADER] ?? '').trim()
    if (!slug) {
      res.status(403).json({
        error:
          'Como administrador, iniciá sesión desde el subdominio de la tienda o indicá la tienda.',
      })
      return
    }
    const business = await prisma.business.findUnique({
      where: { slug },
      select: { id: true },
    })
    if (!business) {
      res.status(404).json({ error: 'Negocio no encontrado' })
      return
    }
    const staffEmployeeId = await getOwnerEmployeeIdForBusinessService(business.id)
    ;(req as BusinessContextRequest).businessContext = {
      businessId: business.id,
      staffEmployeeId,
    }
    next()
    return
  }

  const businessId = req.user?.businessId
  if (!businessId) {
    res.status(403).json({ error: 'No tienes un negocio asignado' })
    return
  }

  let staffEmployeeId: string | null | undefined
  if (req.user?.role === 'STAFF' && req.user?.userId) {
    staffEmployeeId = await getEmployeeIdByUserIdService(req.user.userId, businessId)
  } else if (req.user?.role === 'OWNER') {
    staffEmployeeId = await getOwnerEmployeeIdForBusinessService(businessId)
  } else {
    staffEmployeeId = undefined
  }

  (req as BusinessContextRequest).businessContext = { businessId, staffEmployeeId }
  next()
}
