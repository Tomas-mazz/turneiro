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
  // In development, show actual error for 500 to help debug
  const message =
    statusCode >= 500
      ? (process.env.NODE_ENV === 'development' ? (err.message || 'Algo salió mal') : 'Algo salió mal')
      : (err.message || 'Algo salió mal')

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
