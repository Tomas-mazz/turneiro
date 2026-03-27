import { Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import {
  getServicesForBusinessService,
  updateServicePriceAndDurationService,
  ServiceNotFoundError,
  SubServiceNotFoundError,
  createServiceForBusiness,
  deleteServiceForBusiness,
  getSubServicesForBusiness,
  createSubServiceForBusiness,
  updateSubServiceForBusiness,
  deleteSubServiceForBusiness,
} from '../services/services.service'
import {
  updateServiceSchema,
  createServiceAdminSchema,
  createSubServiceAdminSchema,
  updateSubServiceAdminSchema,
} from '../lib/schemas'
import type { AuthRequest } from '../middleware/auth'
import { getBusinessContextOrRespond } from '../lib/requestGuards'

function canOwnerOrAdminActing(req: AuthRequest): boolean {
  return req.user?.role === 'OWNER' || req.user?.role === 'ADMIN'
}

export async function getServices(req: AuthRequest, res: Response) {
  const ctx = getBusinessContextOrRespond(req, res)
  if (!ctx) return
  const { businessId } = ctx
  const services = await getServicesForBusinessService(businessId)
  return res.json(services)
}

export async function createService(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!canOwnerOrAdminActing(req)) {
      return res.status(403).json({
        error: 'Solo el dueño del negocio puede crear servicios.',
      })
    }
    const ctx = getBusinessContextOrRespond(req, res)
    if (!ctx) return
    const { businessId } = ctx
    const parsed = createServiceAdminSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Error de validación',
        details: (parsed.error as ZodError).errors,
      })
    }
    const created = await createServiceForBusiness(businessId, parsed.data)
    return res.status(201).json(created)
  } catch (err) {
    next(err)
  }
}

export async function updateService(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!canOwnerOrAdminActing(req)) {
      return res.status(403).json({
        error: 'Solo el dueño del negocio puede editar precios y duración de servicios.',
      })
    }
    const ctx = getBusinessContextOrRespond(req, res)
    if (!ctx) return
    const { businessId } = ctx
    const parsed = updateServiceSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Error de validación',
        details: (parsed.error as ZodError).errors,
      })
    }
    const serviceId = req.params.id
    const updated = await updateServicePriceAndDurationService(
      serviceId,
      businessId,
      parsed.data
    )
    return res.json(updated)
  } catch (err) {
    if (err instanceof ServiceNotFoundError) {
      return res.status(404).json({ error: err.message })
    }
    next(err)
  }
}

export async function deleteService(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!canOwnerOrAdminActing(req)) {
      return res.status(403).json({
        error: 'Solo el dueño del negocio puede eliminar servicios.',
      })
    }
    const ctx = getBusinessContextOrRespond(req, res)
    if (!ctx) return
    const { businessId } = ctx
    const serviceId = req.params.id
    if (!serviceId) {
      return res.status(400).json({ error: 'ID de servicio requerido' })
    }
    await deleteServiceForBusiness(serviceId, businessId)
    return res.status(204).send()
  } catch (err) {
    if (err instanceof ServiceNotFoundError) {
      return res.status(404).json({ error: err.message })
    }
    next(err)
  }
}

export async function getSubServices(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ctx = getBusinessContextOrRespond(req, res)
    if (!ctx) return
    const { businessId } = ctx
    const serviceId = req.params.serviceId
    if (!serviceId) {
      return res.status(400).json({ error: 'ID de servicio requerido' })
    }
    const subServices = await getSubServicesForBusiness(serviceId, businessId)
    return res.json(subServices)
  } catch (err) {
    if (err instanceof ServiceNotFoundError) {
      return res.status(404).json({ error: err.message })
    }
    next(err)
  }
}

export async function createSubService(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!canOwnerOrAdminActing(req)) {
      return res.status(403).json({
        error: 'Solo el dueño del negocio puede crear subservicios.',
      })
    }
    const ctx = getBusinessContextOrRespond(req, res)
    if (!ctx) return
    const { businessId } = ctx
    const serviceId = req.params.serviceId
    if (!serviceId) {
      return res.status(400).json({ error: 'ID de servicio requerido' })
    }
    const parsed = createSubServiceAdminSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Error de validación',
        details: (parsed.error as ZodError).errors,
      })
    }
    const created = await createSubServiceForBusiness(serviceId, businessId, parsed.data)
    return res.status(201).json(created)
  } catch (err) {
    if (err instanceof ServiceNotFoundError) {
      return res.status(404).json({ error: err.message })
    }
    next(err)
  }
}

export async function updateSubService(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!canOwnerOrAdminActing(req)) {
      return res.status(403).json({
        error: 'Solo el dueño del negocio puede editar subservicios.',
      })
    }
    const ctx = getBusinessContextOrRespond(req, res)
    if (!ctx) return
    const { businessId } = ctx
    const subServiceId = req.params.id
    if (!subServiceId) {
      return res.status(400).json({ error: 'ID de subservicio requerido' })
    }
    const parsed = updateSubServiceAdminSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Error de validación',
        details: (parsed.error as ZodError).errors,
      })
    }
    const updated = await updateSubServiceForBusiness(subServiceId, businessId, parsed.data)
    return res.json(updated)
  } catch (err) {
    if (err instanceof SubServiceNotFoundError) {
      return res.status(404).json({ error: err.message })
    }
    next(err)
  }
}

export async function deleteSubService(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!canOwnerOrAdminActing(req)) {
      return res.status(403).json({
        error: 'Solo el dueño del negocio puede eliminar subservicios.',
      })
    }
    const ctx = getBusinessContextOrRespond(req, res)
    if (!ctx) return
    const { businessId } = ctx
    const subServiceId = req.params.id
    if (!subServiceId) {
      return res.status(400).json({ error: 'ID de subservicio requerido' })
    }
    await deleteSubServiceForBusiness(subServiceId, businessId)
    return res.status(204).send()
  } catch (err) {
    if (err instanceof SubServiceNotFoundError) {
      return res.status(404).json({ error: err.message })
    }
    next(err)
  }
}
