import { Router } from 'express'
import {
  createPaymentIntent,
  confirmPayment,
} from '../controllers/payments.controller'
import { createPaymentIntentLimiter } from '../middleware/rateLimit'

const router = Router()

router.post('/create-intent', createPaymentIntentLimiter, createPaymentIntent)

// Confirm payment completion
router.post('/confirm', confirmPayment)

export default router
