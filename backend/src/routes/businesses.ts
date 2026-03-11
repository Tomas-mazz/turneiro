import { Router } from 'express'
import {
  getBusinessBySlug,
  getMyBusiness,
  getMyProfile,
  updateMyProfile,
  getBusinessImages,
  updateBusinessImages,
} from '../controllers/businesses.controller'
import { requireBusinessOwner, requireOwnerOnly } from '../middleware/auth'
import { requireBusinessContext } from '../middleware/businessContext'

const router = Router()

router.get('/mine', requireBusinessOwner, requireBusinessContext, getMyBusiness)

router.get('/profile', requireBusinessOwner, requireBusinessContext, getMyProfile)
router.patch('/profile', requireBusinessOwner, requireBusinessContext, updateMyProfile)

router.get('/images', requireOwnerOnly, requireBusinessContext, getBusinessImages)
router.patch('/images', requireOwnerOnly, requireBusinessContext, updateBusinessImages)

router.get('/:slug', getBusinessBySlug)

export default router
