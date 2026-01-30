import { Router } from 'express'
import express from 'express'
import {
  stripeWebhook,
  mercadopagoWebhook,
} from '../controllers/webhooks.controller'

const router = Router()

// Stripe webhook - needs raw body for signature verification
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhook
)

// Mercado Pago webhook (IPN)
router.post('/mercadopago', mercadopagoWebhook)

export default router
