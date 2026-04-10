import { Router } from 'express'
import {
  getBusinessBySlug,
  getMyBusiness,
  getMyProfile,
  updateMyProfile,
  getBusinessImages,
  updateBusinessImages,
  getBusinessSettings,
  updateBusinessSettings,
} from '../controllers/businesses.controller'
import { requireBusinessOwner, requireOwnerOrAdminActing } from '../middleware/auth'
import { requireBusinessContext } from '../middleware/businessContext'
import { validateRequest } from '../middleware/validation'
import {
  createOwnerEmployeeSchema,
  updateOwnerCalendarColorSchema,
  updateOwnerEmployeeSchema,
} from '../lib/schemas'
import {
  createOwnerEmployee,
  deleteOwnerEmployee,
  getOwnerCalendarColor,
  listOwnerEmployees,
  updateOwnerCalendarColor,
  updateOwnerEmployee,
} from '../controllers/ownerEmployees.controller'

const router = Router()

router.get('/mine', requireBusinessOwner, requireBusinessContext, getMyBusiness)

router.get('/profile', requireBusinessOwner, requireBusinessContext, getMyProfile)
router.patch('/profile', requireBusinessOwner, requireBusinessContext, updateMyProfile)

router.get('/images', requireOwnerOrAdminActing, requireBusinessContext, getBusinessImages)
router.patch('/images', requireOwnerOrAdminActing, requireBusinessContext, updateBusinessImages)

router.get('/settings', requireOwnerOrAdminActing, requireBusinessContext, getBusinessSettings)
router.patch('/settings', requireOwnerOrAdminActing, requireBusinessContext, updateBusinessSettings)

// Owner dashboard: employees CRUD (OWNER or ADMIN acting as shop)
router.get('/employees', requireOwnerOrAdminActing, requireBusinessContext, listOwnerEmployees)
router.get('/owner-calendar-color', requireOwnerOrAdminActing, requireBusinessContext, getOwnerCalendarColor)
router.patch(
  '/owner-calendar-color',
  requireOwnerOrAdminActing,
  requireBusinessContext,
  validateRequest(updateOwnerCalendarColorSchema),
  updateOwnerCalendarColor
)
router.post(
  '/employees',
  requireOwnerOrAdminActing,
  requireBusinessContext,
  validateRequest(createOwnerEmployeeSchema),
  createOwnerEmployee
)
router.patch(
  '/employees/:id',
  requireOwnerOrAdminActing,
  requireBusinessContext,
  validateRequest(updateOwnerEmployeeSchema),
  updateOwnerEmployee
)
router.delete('/employees/:id', requireOwnerOrAdminActing, requireBusinessContext, deleteOwnerEmployee)

router.get('/:slug', getBusinessBySlug)

export default router
