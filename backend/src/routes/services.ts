import { Router } from 'express'
import { getServices, updateService } from '../controllers/services.controller'
import { requireBusinessOwner } from '../middleware/auth'
import { requireBusinessContext } from '../middleware/businessContext'

const router = Router()

router.get('/', requireBusinessOwner, requireBusinessContext, getServices)
router.patch('/:id', requireBusinessOwner, requireBusinessContext, updateService)

export default router
