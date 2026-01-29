import { Router } from 'express'
import { getAvailability, getWeekAvailability } from '../controllers/availability.controller'

const router = Router()

router.get('/week', getWeekAvailability)
router.get('/', getAvailability)

export default router
