import { Router } from 'express'
import {
  createAppointment,
  getAppointments,
  getAppointmentLookup,
  cancelAppointment,
  cancelAppointmentByOwner,
} from '../controllers/appointments.controller'
import { requireBusinessOwner } from '../middleware/auth'

const router = Router()

router.post('/', createAppointment)
router.post('/cancel', cancelAppointment)
router.get('/', requireBusinessOwner, getAppointments)
router.get('/lookup', requireBusinessOwner, getAppointmentLookup)
router.post('/:id/cancel', requireBusinessOwner, cancelAppointmentByOwner)

export default router
