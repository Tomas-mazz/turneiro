import { Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import {
  getServicesForBusinessService,
  updateServicePriceAndDurationService,
  ServiceNotFoundError,
} from '../services/services.service'
import { updateServiceSchema } from '../lib/schemas'
import type { AuthRequest } from '../middleware/auth'

export async function getServices(req: AuthRequest, res: Response) {
  const businessId = req.user?.businessId
  if (!businessId) {
    return res.status(403).json({
      error: 'No tienes un negocio asignado',
    })
  }
  const services = await getServicesForBusinessService(businessId)
  return res.json(services)
}

export async function updateService(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (req.user?.role !== 'OWNER') {
      return res.status(403).json({
        error: 'Solo el dueño del negocio puede editar precios y duración de servicios.',
      })
    }
    const businessId = req.user?.businessId
    if (!businessId) {
      return res.status(403).json({
        error: 'No tienes un negocio asignado',
      })
    }
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
