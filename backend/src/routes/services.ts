import { Router } from 'express'
import {
  getServices,
  createService,
  updateService,
  deleteService,
} from '../controllers/services.controller'
import { requireBusinessOwner } from '../middleware/auth'
import { requireBusinessContext } from '../middleware/businessContext'

const router = Router()

router.get('/', requireBusinessOwner, requireBusinessContext, getServices)
router.post('/', requireBusinessOwner, requireBusinessContext, createService)
router.patch('/:id', requireBusinessOwner, requireBusinessContext, updateService)
router.delete('/:id', requireBusinessOwner, requireBusinessContext, deleteService)

export default router
