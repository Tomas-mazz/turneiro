import rateLimit from 'express-rate-limit'

const WINDOW_MS = 15 * 60 * 1000

export const loginLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 5,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const createAppointmentLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 20,
  message: { error: 'Too many booking requests from this address. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const createPaymentIntentLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 10,
  message: { error: 'Too many payment requests. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})
