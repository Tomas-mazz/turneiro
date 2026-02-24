import { Router } from 'express'
import { login } from '../controllers/auth.controller'
import { loginLimiter } from '../middleware/rateLimit'

const router = Router()

router.post('/login', loginLimiter, login)

export default router
