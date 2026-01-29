import { Router } from 'express'
import { getServices, updateService } from '../controllers/services.controller'
import { requireBusinessOwner } from '../middleware/auth'

const router = Router()

router.get('/', requireBusinessOwner, getServices)
router.patch('/:id', requireBusinessOwner, updateService)

export default router
