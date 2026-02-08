import { Router } from 'express'
import { requireAdmin } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'
import { createBusinessSchema, updateBusinessSchema, createServiceAdminSchema, updateServiceAdminSchema } from '../lib/schemas'
import {
  getBusinesses,
  getBusinessById,
  createBusiness,
  updateBusiness,
  getBusinessServices,
  createService,
  updateService,
  deleteService,
} from '../controllers/admin.controller'

const router = Router()

router.get('/businesses', requireAdmin, getBusinesses)
router.get('/businesses/:id/services', requireAdmin, getBusinessServices)
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

router.post(
  '/businesses/:id/services',
  requireAdmin,
  validateRequest(createServiceAdminSchema),
  createService
)

router.patch(
  '/services/:id',
  requireAdmin,
  validateRequest(updateServiceAdminSchema),
  updateService
)
router.delete('/services/:id', requireAdmin, deleteService)

export default router
