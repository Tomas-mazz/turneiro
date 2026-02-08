import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

// TODO: Implement request validation middleware using Zod
export function validateRequest(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        })
      }
      next(error)
    }
  }
}
