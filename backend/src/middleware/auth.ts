import { Request, Response, NextFunction } from 'express'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: 'OWNER' | 'ADMIN' | 'STAFF'
    businessId?: string
  }
}

// TODO: Implement JWT authentication middleware
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  // TODO: Verify JWT token
  // TODO: Extract user information from token
  // TODO: Attach user to request object
  next()
}

export function requireBusinessOwner(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!req.user || !['OWNER', 'ADMIN', 'STAFF'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    next()
  })
}
