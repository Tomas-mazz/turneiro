import { Router } from 'express'
import {
  createAppointment,
  holdAppointment,
  completeCheckout,
  getAppointments,
  getAppointmentLookup,
  cancelAppointment,
  cancelAppointmentByOwner,
  getAppointmentByToken,
} from '../controllers/appointments.controller'
import { requireBusinessOwner } from '../middleware/auth'
import { requireBusinessContext } from '../middleware/businessContext'
import { createAppointmentLimiter } from '../middleware/rateLimit'

const router = Router()

router.post('/', createAppointmentLimiter, createAppointment)
router.post('/hold', createAppointmentLimiter, holdAppointment)
router.post('/:id/checkout', createAppointmentLimiter, completeCheckout)
router.post('/cancel', cancelAppointment)
router.get('/by-token/:token', getAppointmentByToken)
router.get('/', requireBusinessOwner, requireBusinessContext, getAppointments)
router.get('/lookup', requireBusinessOwner, requireBusinessContext, getAppointmentLookup)
router.post('/:id/cancel', requireBusinessOwner, requireBusinessContext, cancelAppointmentByOwner)

export default router
