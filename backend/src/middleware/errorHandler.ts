import { Request, Response, NextFunction } from 'express'

export interface AppError extends Error {
  statusCode?: number
  code?: string
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by Express error middleware signature
  next: NextFunction
) {
  const statusCode = err.statusCode || 500
  // Never send internal error details to the client for 500
  const message =
    statusCode >= 500 ? 'Algo salió mal' : (err.message || 'Algo salió mal')

  console.error('Error:', {
    statusCode,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  })

  res.status(statusCode).json({
    error: message,
    code: err.code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}
