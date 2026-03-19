import { Router } from 'express'
import {
  createPaymentIntent,
  confirmPayment,
  cancelPendingPayment,
} from '../controllers/payments.controller'
import { createPaymentIntentLimiter } from '../middleware/rateLimit'

const router = Router()

router.post('/create-intent', createPaymentIntentLimiter, createPaymentIntent)

// Confirm payment completion
router.post('/confirm', confirmPayment)
router.post('/cancel-pending', cancelPendingPayment)

export default router
