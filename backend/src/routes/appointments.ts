import { Router } from 'express'
import {
  createAppointment,
  getAppointments,
  getAppointmentLookup,
  cancelAppointment,
  cancelAppointmentByOwner,
} from '../controllers/appointments.controller'
import { requireBusinessOwner } from '../middleware/auth'
import { requireBusinessContext } from '../middleware/businessContext'
import { createAppointmentLimiter } from '../middleware/rateLimit'

const router = Router()

router.post('/', createAppointmentLimiter, createAppointment)
router.post('/cancel', cancelAppointment)
router.get('/', requireBusinessOwner, requireBusinessContext, getAppointments)
router.get('/lookup', requireBusinessOwner, requireBusinessContext, getAppointmentLookup)
router.post('/:id/cancel', requireBusinessOwner, requireBusinessContext, cancelAppointmentByOwner)

export default router
