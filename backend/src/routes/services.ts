import { Router } from 'express'
import {
  getServices,
  createService,
  updateService,
  deleteService,
  getSubServices,
  createSubService,
  updateSubService,
  deleteSubService,
} from '../controllers/services.controller'
import { requireBusinessOwner } from '../middleware/auth'
import { requireBusinessContext } from '../middleware/businessContext'
import { validateRequest } from '../middleware/validation'
import { createSubServiceAdminSchema, updateSubServiceAdminSchema } from '../lib/schemas'

const router = Router()

router.get('/', requireBusinessOwner, requireBusinessContext, getServices)
router.post('/', requireBusinessOwner, requireBusinessContext, createService)
router.patch('/:id', requireBusinessOwner, requireBusinessContext, updateService)
router.delete('/:id', requireBusinessOwner, requireBusinessContext, deleteService)
router.get('/:serviceId/subservices', requireBusinessOwner, requireBusinessContext, getSubServices)
router.post(
  '/:serviceId/subservices',
  requireBusinessOwner,
  requireBusinessContext,
  validateRequest(createSubServiceAdminSchema),
  createSubService
)
router.patch(
  '/subservices/:id',
  requireBusinessOwner,
  requireBusinessContext,
  validateRequest(updateSubServiceAdminSchema),
  updateSubService
)
router.delete('/subservices/:id', requireBusinessOwner, requireBusinessContext, deleteSubService)

export default router
