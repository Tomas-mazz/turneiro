import { Router } from 'express'
import { login, register } from '../controllers/auth.controller'
import { loginLimiter } from '../middleware/rateLimit'

const router = Router()

router.post('/login', loginLimiter, login)
router.post('/register', loginLimiter, register)

export default router
