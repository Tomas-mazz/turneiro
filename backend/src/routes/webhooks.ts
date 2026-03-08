import { Router } from 'express'
import { mercadopagoWebhook } from '../controllers/webhooks.controller'

const router = Router()

// Mercado Pago webhook (IPN)
router.post('/mercadopago', mercadopagoWebhook)

export default router
