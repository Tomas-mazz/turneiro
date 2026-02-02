import { Router } from 'express'
import { getBusinessBySlug, getMyBusiness } from '../controllers/businesses.controller'
import { requireBusinessOwner } from '../middleware/auth'

const router = Router()

router.get('/mine', requireBusinessOwner, getMyBusiness)
router.get('/:slug', getBusinessBySlug)
// GET / (list businesses) - requires auth, TODO later
// router.get('/', requireAuth, getBusinesses)

export default router
