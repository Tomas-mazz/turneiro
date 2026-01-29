import { Router } from 'express'
import {
  createAppointment,
  getAppointments,
  cancelAppointment,
  cancelAppointmentByOwner,
} from '../controllers/appointments.controller'
import { requireBusinessOwner } from '../middleware/auth'

const router = Router()

router.post('/', createAppointment)
router.post('/cancel', cancelAppointment)
router.get('/', requireBusinessOwner, getAppointments)
router.post('/:id/cancel', requireBusinessOwner, cancelAppointmentByOwner)

export default router
