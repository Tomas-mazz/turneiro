import rateLimit from 'express-rate-limit'

const WINDOW_MS = 15 * 60 * 1000

export const loginLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 5,
  message: { error: 'Demasiados intentos de inicio de sesión. Intentá de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const createAppointmentLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 20,
  message: { error: 'Demasiadas reservas desde esta dirección. Intentá de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const createPaymentIntentLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 10,
  message: { error: 'Demasiadas solicitudes de pago. Intentá de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
})
