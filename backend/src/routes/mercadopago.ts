import { Router } from 'express'
import { requireOwnerOrAdminActing } from '../middleware/auth'
import { requireBusinessContext } from '../middleware/businessContext'
import {
  disconnectMercadoPagoOAuth,
  getMercadoPagoOAuthStatus,
  initiateMercadoPagoOAuth,
  mercadoPagoOAuthCallback,
} from '../controllers/mercadopago-oauth.controller'

const router = Router()

router.get('/oauth/auth', requireOwnerOrAdminActing, requireBusinessContext, initiateMercadoPagoOAuth)
router.get('/oauth/callback', mercadoPagoOAuthCallback)
router.get('/oauth/status', requireOwnerOrAdminActing, requireBusinessContext, getMercadoPagoOAuthStatus)
router.post('/oauth/disconnect', requireOwnerOrAdminActing, requireBusinessContext, disconnectMercadoPagoOAuth)

export default router
