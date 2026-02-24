import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { loginService, AuthError } from '../services/auth.service'
import { loginSchema } from '../lib/schemas'

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
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
    res.json(result)
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(400).json({ error: err.message })
      return
    }
    next(err)
  }
}
