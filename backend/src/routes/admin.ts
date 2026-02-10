import { Router } from 'express'
import { requireAdmin } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'
import {
  createBusinessSchema,
  updateBusinessSchema,
  createServiceAdminSchema,
  updateServiceAdminSchema,
  updateWorkingHoursSchema,
} from '../lib/schemas'
import {
  getBusinesses,
  getBusinessById,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  getBusinessServices,
  createService,
  updateService,
  deleteService,
  getWorkingHours,
  updateWorkingHours,
  getAdminBlockedSlots,
  createAdminBlockedSlot,
  deleteAdminBlockedSlot,
  listAdminAppointments,
  adminCancelAppointment,
  adminUpdateAppointmentStatus,
  getBusinessEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../controllers/admin.controller'

const router = Router()

router.get('/businesses', requireAdmin, getBusinesses)
router.get('/businesses/:id/services', requireAdmin, getBusinessServices)
router.get('/businesses/:id/working-hours', requireAdmin, getWorkingHours)
router.put(
  '/businesses/:id/working-hours',
  requireAdmin,
  validateRequest(updateWorkingHoursSchema),
  updateWorkingHours
)
router.get('/businesses/:id/blocked-slots', requireAdmin, getAdminBlockedSlots)
router.post('/businesses/:id/blocked-slots', requireAdmin, createAdminBlockedSlot)
router.delete('/blocked-slots/:id', requireAdmin, deleteAdminBlockedSlot)
router.get('/businesses/:id', requireAdmin, getBusinessById)
router.post(
  '/businesses',
  requireAdmin,
  validateRequest(createBusinessSchema),
  createBusiness
)
router.patch(
  '/businesses/:id',
  requireAdmin,
  validateRequest(updateBusinessSchema),
  updateBusiness
)
router.delete('/businesses/:id', requireAdmin, deleteBusiness)

router.post(
  '/businesses/:id/services',
  requireAdmin,
  validateRequest(createServiceAdminSchema),
  createService
)

router.patch(
  '/services/:id',
  requireAdmin,
  validateRequest(updateServiceAdminSchema),
  updateService
)
router.delete('/services/:id', requireAdmin, deleteService)

router.get('/appointments', requireAdmin, listAdminAppointments)
router.post('/appointments/:id/cancel', requireAdmin, adminCancelAppointment)
router.patch('/appointments/:id/status', requireAdmin, adminUpdateAppointmentStatus)

router.get('/businesses/:id/employees', requireAdmin, getBusinessEmployees)
router.post('/businesses/:id/employees', requireAdmin, createEmployee)
router.patch('/employees/:id', requireAdmin, updateEmployee)
router.delete('/employees/:id', requireAdmin, deleteEmployee)

export default router
