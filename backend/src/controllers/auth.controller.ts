import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { loginService, registerService, AuthError } from '../services/auth.service'
import { loginSchema, registerSchema } from '../lib/schemas'
import {
  getLoginLockMessage,
  recordLoginFailure,
  clearLoginLock,
} from '../middleware/loginAttempts'

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim()
  if (Array.isArray(forwarded)) return forwarded[0]?.trim() ?? ''
  return req.socket?.remoteAddress ?? ''
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ip = getClientIp(req)
  const lock = getLoginLockMessage(ip)
  if (lock) {
    res.setHeader('Retry-After', String(lock.retryAfterSeconds))
    res.status(429).json({ error: lock.message })
    return
  }
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        error: 'Error de validación',
        details: (parsed.error as ZodError).errors,
      })
      return
    }
    const result = await loginService(parsed.data)
    clearLoginLock(ip)
    res.json(result)
  } catch (err) {
    if (err instanceof AuthError) {
      recordLoginFailure(ip)
      const lock = getLoginLockMessage(ip)
      if (lock) {
        res.setHeader('Retry-After', String(lock.retryAfterSeconds))
        res.status(429).json({ error: lock.message })
        return
      }
      res.status(400).json({ error: err.message })
      return
    }
    next(err)
  }
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        error: 'Error de validación',
        details: (parsed.error as ZodError).errors,
      })
      return
    }
    const result = await registerService(parsed.data)
    res.json(result)
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(400).json({ error: err.message })
      return
    }
    next(err)
  }
}
