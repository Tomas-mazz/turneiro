import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../lib/jwt'
import type { JwtPayload } from '../lib/jwt'

export interface AuthRequest extends Request {
  user?: JwtPayload
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    res.status(401).json({ error: 'Token de autenticación requerido' })
    return
  }

  try {
    const payload = verifyToken(token)
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      businessId: payload.businessId,
    }
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

export function requireBusinessOwner(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  requireAuth(req, res, () => {
    if (!req.user || !['OWNER', 'ADMIN', 'STAFF'].includes(req.user.role)) {
      res.status(403).json({ error: 'Acceso denegado' })
      return
    }
    next()
  })
}

export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  requireAuth(req, res, () => {
    if (!req.user || req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Acceso denegado. Solo administradores.' })
      return
    }
    next()
  })
}

export function requireOwnerOnly(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  requireAuth(req, res, () => {
    if (!req.user || req.user.role !== 'OWNER') {
      res.status(403).json({ error: 'Acceso denegado. Solo dueños del negocio.' })
      return
    }
    next()
  })
}
