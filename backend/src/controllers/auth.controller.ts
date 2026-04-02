import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import {
  loginService,
  registerService,
  googleOAuthService,
  getMeService,
  AuthError,
} from '../services/auth.service'
import { loginSchema, registerSchema } from '../lib/schemas'
import {
  getLoginLockMessage,
  recordLoginFailure,
  clearLoginLock,
} from '../middleware/loginAttempts'
import type { AuthRequest } from '../middleware/auth'

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

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

export async function getGoogle(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const state = typeof req.query.state === 'string' ? req.query.state : ''
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`
    const redirectUri = `${backendUrl}/api/auth/google/callback`
    if (!clientId) {
      res.status(503).json({ error: 'Login con Google no está configurado' })
      return
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
    })
    res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`)
  } catch (err) {
    next(err)
  }
}

export async function getGoogleCallback(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const code = typeof req.query.code === 'string' ? req.query.code : ''
    const state = typeof req.query.state === 'string' ? req.query.state : ''
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`
    const redirectUri = `${backendUrl}/api/auth/google/callback`
    if (!code || !state) {
      res.redirect(`${frontendUrl}/auth/callback?error=missing_params`)
      return
    }
    const result = await googleOAuthService({ code, redirectUri, state })
    const safeSlug = state.trim().toLowerCase()
    const isValidSlug = /^[a-z0-9-]+$/.test(safeSlug)
    const callbackBase = (() => {
      if (!isValidSlug) return frontendUrl.replace(/\/$/, '')
      try {
        const base = new URL(frontendUrl)
        const host = base.hostname.toLowerCase()

        // Dev: http://localhost:3000 -> http://{slug}.localhost:3000
        if (host === 'localhost' || host === '127.0.0.1') {
          base.hostname = `${safeSlug}.localhost`
          return base.toString().replace(/\/$/, '')
        }

        // Prod: https://turneiro.com or https://www.turneiro.com -> https://{slug}.turneiro.com
        if (host === 'turneiro.com' || host === 'www.turneiro.com') {
          base.hostname = `${safeSlug}.turneiro.com`
          return base.toString().replace(/\/$/, '')
        }

        // Fallback: keep configured frontend host
        return frontendUrl.replace(/\/$/, '')
      } catch {
        return frontendUrl.replace(/\/$/, '')
      }
    })()

    res.redirect(`${callbackBase}/auth/callback?token=${encodeURIComponent(result.token)}`)
  } catch (err) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const message = err instanceof AuthError ? encodeURIComponent(err.message) : 'auth_error'
    res.redirect(`${frontendUrl}/auth/callback?error=${message}`)
  }
}

export async function getMe(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' })
      return
    }
    const user = await getMeService(req.user.userId)
    if (!user) {
      res.status(401).json({ error: 'Usuario no encontrado' })
      return
    }
    res.json(user)
  } catch (err) {
    next(err)
  }
}
