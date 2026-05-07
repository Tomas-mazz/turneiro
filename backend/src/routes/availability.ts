import { Router } from 'express'
import { getAvailability, getWeekAvailability, getEligibleEmployees } from '../controllers/availability.controller'

const router = Router()

router.get('/week', getWeekAvailability)
router.get('/eligible-employees', getEligibleEmployees)
router.get('/', getAvailability)

export default router
