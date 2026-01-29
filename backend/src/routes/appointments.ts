import { Router } from 'express'
import {
  createAppointment,
  getAppointments,
  cancelAppointment,
} from '../controllers/appointments.controller'

const router = Router()

router.post('/', createAppointment)
router.post('/cancel', cancelAppointment)
// router.get('/', requireAuth, getAppointments)

export default router
