import { Router } from 'express'
import { requireAdmin } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'
import { createBusinessSchema, updateBusinessSchema } from '../lib/schemas'
import {
  getBusinesses,
  getBusinessById,
  createBusiness,
  updateBusiness,
} from '../controllers/admin.controller'

const router = Router()

router.get('/businesses', requireAdmin, getBusinesses)
router.get('/businesses/:id', requireAdmin, getBusinessById)
router.post(
  '/businesses',
  requireAdmin,
  validateRequest(createBusinessSchema),
  createBusiness
)
router.patch(
  '/businesses/:id',
  requireAdmin,
  validateRequest(updateBusinessSchema),
  updateBusiness
)

export default router
