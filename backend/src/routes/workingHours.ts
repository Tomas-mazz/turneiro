import { Router } from 'express'
import { requireBusinessOwner } from '../middleware/auth'
import { requireBusinessContext } from '../middleware/businessContext'
import { getMyWorkingHours, updateMyWorkingHours } from '../controllers/workingHours.controller'

const router = Router()

router.get('/', requireBusinessOwner, requireBusinessContext, getMyWorkingHours)
router.put('/', requireBusinessOwner, requireBusinessContext, updateMyWorkingHours)

export default router

