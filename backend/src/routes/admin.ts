import { Router } from 'express'
import { requireAdmin } from '../middleware/auth'
import { requireAdminBusinessId } from '../middleware/adminBusinessId'
import { validateRequest } from '../middleware/validation'
import {
  createBusinessSchema,
  updateBusinessSchema,
  createServiceAdminSchema,
  updateServiceAdminSchema,
  updateWorkingHoursSchema,
  createSubServiceAdminSchema,
  updateSubServiceAdminSchema,
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
   getSubServices,
   createSubService,
   updateSubService,
   deleteSubService,
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
import { createSeller, deleteSeller, getSellerDetail, listSellers } from '../controllers/sellersAdmin.controller'

const router = Router()

router.get('/sellers', requireAdmin, listSellers)
router.post('/sellers', requireAdmin, createSeller)
router.get('/sellers/:id', requireAdmin, getSellerDetail)
router.delete('/sellers/:id', requireAdmin, deleteSeller)

router.get('/businesses', requireAdmin, getBusinesses)
router.get('/businesses/:id', requireAdmin, requireAdminBusinessId, getBusinessById)
router.patch(
  '/businesses/:id',
  requireAdmin,
  validateRequest(updateBusinessSchema),
  requireAdminBusinessId,
  updateBusiness
)
router.delete('/businesses/:id', requireAdmin, requireAdminBusinessId, deleteBusiness)

router.get('/businesses/:id/services', requireAdmin, requireAdminBusinessId, getBusinessServices)
router.post(
  '/businesses/:id/services',
  requireAdmin,
  requireAdminBusinessId,
  validateRequest(createServiceAdminSchema),
  createService
)
router.get(
  '/services/:serviceId/subservices',
  requireAdmin,
  getSubServices
)
router.post(
  '/services/:serviceId/subservices',
  requireAdmin,
  validateRequest(createSubServiceAdminSchema),
  createSubService
)
router.get('/businesses/:id/working-hours', requireAdmin, requireAdminBusinessId, getWorkingHours)
router.put(
  '/businesses/:id/working-hours',
  requireAdmin,
  requireAdminBusinessId,
  validateRequest(updateWorkingHoursSchema),
  updateWorkingHours
)
router.get('/businesses/:id/blocked-slots', requireAdmin, requireAdminBusinessId, getAdminBlockedSlots)
router.post('/businesses/:id/blocked-slots', requireAdmin, requireAdminBusinessId, createAdminBlockedSlot)
router.delete('/blocked-slots/:id', requireAdmin, deleteAdminBlockedSlot)

router.post(
  '/businesses',
  requireAdmin,
  validateRequest(createBusinessSchema),
  createBusiness
)

router.patch(
  '/services/:id',
  requireAdmin,
  validateRequest(updateServiceAdminSchema),
  updateService
)
router.delete('/services/:id', requireAdmin, deleteService)
router.patch(
  '/subservices/:id',
  requireAdmin,
  validateRequest(updateSubServiceAdminSchema),
  updateSubService
)
router.delete('/subservices/:id', requireAdmin, deleteSubService)

router.get('/appointments', requireAdmin, listAdminAppointments)
router.post('/appointments/:id/cancel', requireAdmin, adminCancelAppointment)
router.patch('/appointments/:id/status', requireAdmin, adminUpdateAppointmentStatus)

router.get('/businesses/:id/employees', requireAdmin, requireAdminBusinessId, getBusinessEmployees)
router.post('/businesses/:id/employees', requireAdmin, requireAdminBusinessId, createEmployee)
router.patch('/employees/:id', requireAdmin, updateEmployee)
router.delete('/employees/:id', requireAdmin, deleteEmployee)

export default router
