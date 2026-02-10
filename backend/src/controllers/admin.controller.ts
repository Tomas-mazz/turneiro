import { Request, Response, NextFunction } from 'express'
import {
  getAllBusinessesForAdmin,
  getBusinessByIdForAdmin,
  createBusinessForAdmin,
  updateBusinessForAdmin,
} from '../services/businesses.service'
import {
  getServicesForBusinessService,
  createServiceForAdmin,
  updateServiceForAdmin,
  deleteServiceForAdmin,
  ServiceNotFoundError,
} from '../services/services.service'
import {
  getWorkingHoursForBusiness,
  upsertWorkingHoursForBusiness,
} from '../services/workingHours.service'
import {
  listBlockedSlotsService,
  createBlockedSlotService,
  deleteBlockedSlotForAdmin,
  BlockedSlotNotFoundError,
} from '../services/blockedSlots.service'
import {
  getEmployeesForBusinessService,
  createEmployeeForAdmin,
  updateEmployeeForAdmin,
  deleteEmployeeForAdmin,
  EmployeeNotFoundError,
} from '../services/employees.service'
import {
  getAppointmentsForAdminService,
  adminCancelAppointmentService,
  adminUpdateAppointmentStatusService,
  CancellationNotAllowedError,
} from '../services/appointments.service'
import { deleteBusinessForAdmin } from '../services/businesses.service'
import {
  createBlockedSlotSchema,
  listBlockedSlotsQuerySchema,
  adminListAppointmentsQuerySchema,
  adminCancelAppointmentSchema,
  adminUpdateAppointmentStatusSchema,
  createEmployeeAdminSchema,
  updateEmployeeAdminSchema,
} from '../lib/schemas'
import type { AuthRequest } from '../middleware/auth'
import { ZodError } from 'zod'

export async function getBusinesses(_req: Request, res: Response) {
  const businesses = await getAllBusinessesForAdmin()
  return res.json(businesses)
}

export async function getBusinessById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id
    if (!id) {
      res.status(400).json({ error: 'ID de negocio obligatorio' })
      return
    }
    const business = await getBusinessByIdForAdmin(id)
    if (!business) {
      res.status(404).json({ error: 'Negocio no encontrado' })
      return
    }
    res.json(business)
  } catch (err) {
    next(err)
  }
}

export async function createBusiness(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = req.body
    const result = await createBusinessForAdmin({
      name: body.name,
      slug: body.slug,
      category: body.category,
      description: body.description,
      phone: body.phone,
      email: body.email,
      address: body.address,
      logo: body.logo,
      coverPhoto: body.coverPhoto,
      coverVideo: body.coverVideo,
      theme: body.theme,
      paymentRequired: !!body.paymentRequired,
      ownerEmail: body.ownerEmail,
      ownerPassword: body.ownerPassword,
    })
    res.status(201).json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al crear el negocio'
    if (message.includes('slug') || message.includes('email')) {
      res.status(400).json({ error: message })
      return
    }
    // Log full error for debugging 500s
    console.error('createBusiness error:', err)
    next(err)
  }
}

export async function updateBusiness(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params.id
    if (!id) {
      res.status(400).json({ error: 'ID de negocio obligatorio' })
      return
    }
    const body = req.body
    await updateBusinessForAdmin(id, {
      name: body.name,
      slug: body.slug,
      category: body.category,
      description: body.description,
      phone: body.phone,
      email: body.email,
      address: body.address,
      logo: body.logo,
      coverPhoto: body.coverPhoto,
      coverVideo: body.coverVideo,
      theme: body.theme,
      paymentRequired: body.paymentRequired,
      paymentType: body.paymentType,
      depositPercentage: body.depositPercentage,
      freeCancellationWindow: body.freeCancellationWindow,
      cancellationHasCost: body.cancellationHasCost,
      lateCancellationFee: body.lateCancellationFee,
      bufferTime: body.bufferTime,
      ownerEmail: body.ownerEmail,
      ownerPassword: body.ownerPassword,
    })
    res.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al actualizar el negocio'
    if (message.includes('slug') || message.includes('email') || message.includes('no encontrado')) {
      const status = message.includes('no encontrado') ? 404 : 400
      res.status(status).json({ error: message })
      return
    }
    next(err)
  }
}

export async function getBusinessServices(req: Request, res: Response, next: NextFunction) {
  try {
    const businessId = req.params.id
    if (!businessId) {
      res.status(400).json({ error: 'ID de negocio obligatorio' })
      return
    }
    const services = await getServicesForBusinessService(businessId)
    return res.json(services)
  } catch (err) {
    console.error('getBusinessServices error:', err)
    next(err)
  }
}

export async function createService(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const businessId = req.params.id
    if (!businessId) {
      res.status(400).json({ error: 'ID de negocio obligatorio' })
      return
    }
    const body = req.body
    const service = await createServiceForAdmin(businessId, {
      name: body.name,
      price: body.price,
      duration: body.duration,
      isActive: body.isActive,
    })
    res.status(201).json(service)
  } catch (err) {
    next(err)
  }
}

export async function updateService(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const serviceId = req.params.id
    if (!serviceId) {
      res.status(400).json({ error: 'ID de servicio obligatorio' })
      return
    }
    const body = req.body
    const service = await updateServiceForAdmin(serviceId, {
      name: body.name,
      price: body.price,
      duration: body.duration,
      isActive: body.isActive,
    })
    res.json(service)
  } catch (err) {
    if (err instanceof ServiceNotFoundError) {
      res.status(404).json({ error: err.message })
      return
    }
    next(err)
  }
}

export async function deleteService(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const serviceId = req.params.id
    if (!serviceId) {
      res.status(400).json({ error: 'ID de servicio obligatorio' })
      return
    }
    await deleteServiceForAdmin(serviceId)
    res.json({ ok: true })
  } catch (err) {
    if (err instanceof ServiceNotFoundError) {
      res.status(404).json({ error: err.message })
      return
    }
    next(err)
  }
}

export async function getWorkingHours(req: Request, res: Response, next: NextFunction) {
  try {
    const businessId = req.params.id
    if (!businessId) {
      res.status(400).json({ error: 'ID de negocio obligatorio' })
      return
    }
    const hours = await getWorkingHoursForBusiness(businessId)
    res.json(hours)
  } catch (err) {
    next(err)
  }
}

export async function updateWorkingHours(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const businessId = req.params.id
    if (!businessId) {
      res.status(400).json({ error: 'ID de negocio obligatorio' })
      return
    }
    const { hours } = req.body
    const updated = await upsertWorkingHoursForBusiness(businessId, hours)
    res.json(updated)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al guardar horarios'
    if (message.includes('no encontrado')) {
      res.status(404).json({ error: message })
      return
    }
    next(err)
  }
}

export async function getAdminBlockedSlots(req: Request, res: Response, next: NextFunction) {
  try {
    const businessId = req.params.id
    if (!businessId) {
      res.status(400).json({ error: 'ID de negocio obligatorio' })
      return
    }
    const parsed = listBlockedSlotsQuerySchema.safeParse(req.query)
    const query = parsed.success ? parsed.data : {}
    const slots = await listBlockedSlotsService(businessId, query)
    res.json(slots)
  } catch (err) {
    next(err)
  }
}

export async function createAdminBlockedSlot(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const businessId = req.params.id
    if (!businessId) {
      res.status(400).json({ error: 'ID de negocio obligatorio' })
      return
    }
    const parsed = createBlockedSlotSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Error de validación',
        details: (parsed.error as ZodError).errors,
      })
    }
    const created = await createBlockedSlotService(businessId, parsed.data)
    res.status(201).json(created)
  } catch (err) {
    next(err)
  }
}

export async function deleteAdminBlockedSlot(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params.id
    if (!id) {
      res.status(400).json({ error: 'ID de bloqueo obligatorio' })
      return
    }
    await deleteBlockedSlotForAdmin(id)
    res.status(204).send()
  } catch (err) {
    if (err instanceof BlockedSlotNotFoundError) {
      res.status(404).json({ error: err.message })
      return
    }
    next(err)
  }
}

export async function deleteBusiness(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const businessId = req.params.id
    if (!businessId) {
      res.status(400).json({ error: 'ID de negocio obligatorio' })
      return
    }
    await deleteBusinessForAdmin(businessId)
    res.status(204).send()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al eliminar'
    if (message.includes('no encontrado')) {
      res.status(404).json({ error: message })
      return
    }
    next(err)
  }
}

export async function getBusinessEmployees(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const businessId = req.params.id
    if (!businessId) {
      return res.status(400).json({ error: 'ID de negocio obligatorio' })
    }
    const employees = await getEmployeesForBusinessService(businessId)
    res.json(employees)
  } catch (err) {
    next(err)
  }
}

export async function createEmployee(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const businessId = req.params.id
    if (!businessId) {
      return res.status(400).json({ error: 'ID de negocio obligatorio' })
    }
    const parsed = createEmployeeAdminSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Error de validación',
        details: (parsed.error as ZodError).errors,
      })
    }
    const employee = await createEmployeeForAdmin(businessId, parsed.data)
    res.status(201).json(employee)
  } catch (err) {
    next(err)
  }
}

export async function updateEmployee(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const employeeId = req.params.id
    if (!employeeId) {
      return res.status(400).json({ error: 'ID de empleado obligatorio' })
    }
    const parsed = updateEmployeeAdminSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Error de validación',
        details: (parsed.error as ZodError).errors,
      })
    }
    const employee = await updateEmployeeForAdmin(employeeId, parsed.data)
    res.json(employee)
  } catch (err) {
    if (err instanceof EmployeeNotFoundError) {
      return res.status(404).json({ error: err.message })
    }
    next(err)
  }
}

export async function deleteEmployee(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const employeeId = req.params.id
    if (!employeeId) {
      return res.status(400).json({ error: 'ID de empleado obligatorio' })
    }
    await deleteEmployeeForAdmin(employeeId)
    res.status(204).send()
  } catch (err) {
    if (err instanceof EmployeeNotFoundError) {
      return res.status(404).json({ error: err.message })
    }
    next(err)
  }
}

export async function listAdminAppointments(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = adminListAppointmentsQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Error de validación',
        details: (parsed.error as ZodError).errors,
      })
    }
    const { businessId, dateFrom, dateTo, status } = parsed.data
    const appointments = await getAppointmentsForAdminService({
      businessId,
      dateFrom,
      dateTo,
      status,
    })
    res.json(appointments)
  } catch (err) {
    next(err)
  }
}

export async function adminCancelAppointment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const appointmentId = req.params.id
    if (!appointmentId) {
      return res.status(400).json({ error: 'ID de cita obligatorio' })
    }
    const parsed = adminCancelAppointmentSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Error de validación',
        details: (parsed.error as ZodError).errors,
      })
    }
    const result = await adminCancelAppointmentService(appointmentId, parsed.data.reason)
    res.status(200).json(result)
  } catch (err) {
    if (err instanceof CancellationNotAllowedError) {
      return res.status(400).json({ error: err.message })
    }
    next(err)
  }
}

export async function adminUpdateAppointmentStatus(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const appointmentId = req.params.id
    if (!appointmentId) {
      return res.status(400).json({ error: 'ID de cita obligatorio' })
    }
    const parsed = adminUpdateAppointmentStatusSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Error de validación',
        details: (parsed.error as ZodError).errors,
      })
    }
    const result = await adminUpdateAppointmentStatusService(
      appointmentId,
      parsed.data.status
    )
    res.status(200).json(result)
  } catch (err) {
    if (err instanceof CancellationNotAllowedError) {
      return res.status(400).json({ error: err.message })
    }
    next(err)
  }
}
