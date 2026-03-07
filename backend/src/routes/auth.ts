import { Router } from 'express'
import {
  login,
  register,
  getGoogle,
  getGoogleCallback,
  getMe,
} from '../controllers/auth.controller'
import { loginLimiter } from '../middleware/rateLimit'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.post('/login', loginLimiter, login)
router.post('/register', loginLimiter, register)
router.get('/me', requireAuth, getMe)
router.get('/google', getGoogle)
router.get('/google/callback', getGoogleCallback)

export default router
