import { Router } from 'express'
import { login, register } from '../controllers/auth.controller'

const router = Router()

router.post('/login', login)
router.post('/register', register)
// router.post('/verify-email', verifyEmail)

export default router
