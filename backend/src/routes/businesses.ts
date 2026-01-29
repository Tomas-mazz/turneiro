import { Router } from 'express'
import { getBusinessBySlug } from '../controllers/businesses.controller'

const router = Router()

router.get('/:slug', getBusinessBySlug)
// GET / (list businesses) - requires auth, TODO later
// router.get('/', requireAuth, getBusinesses)

export default router
