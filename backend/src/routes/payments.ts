import { Router } from 'express'
import {
  createPaymentIntent,
  confirmPayment,
} from '../controllers/payments.controller'

const router = Router()

// Create payment intent (Stripe) or preference (Mercado Pago)
router.post('/create-intent', createPaymentIntent)

// Confirm payment completion
router.post('/confirm', confirmPayment)

export default router
