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

const router = Router()

router.get('/mine', requireBusinessOwner, requireBusinessContext, getMyBusiness)

router.get('/profile', requireBusinessOwner, requireBusinessContext, getMyProfile)
router.patch('/profile', requireBusinessOwner, requireBusinessContext, updateMyProfile)

router.get('/images', requireOwnerOrAdminActing, requireBusinessContext, getBusinessImages)
router.patch('/images', requireOwnerOrAdminActing, requireBusinessContext, updateBusinessImages)

router.get('/settings', requireOwnerOrAdminActing, requireBusinessContext, getBusinessSettings)
router.patch('/settings', requireOwnerOrAdminActing, requireBusinessContext, updateBusinessSettings)

router.get('/:slug', getBusinessBySlug)

export default router
