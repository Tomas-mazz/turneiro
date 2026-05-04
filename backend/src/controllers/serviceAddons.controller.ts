import { Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import type { AuthRequest } from '../middleware/auth'
import { getBusinessContextOrRespond } from '../lib/requestGuards'
import {
  createServiceAddOnForBusiness,
  deleteServiceAddOnForBusiness,
  listServiceAddOnsForBusinessAdmin,
  updateServiceAddOnForBusiness,
  ServiceAddOnNotFoundError,
} from '../services/serviceAddons.service'
import { IndustryCapabilityError } from '../lib/industryCapabilities'
import {
  createServiceAddOnSchema,
  updateServiceAddOnSchema,
} from '../lib/schemas'

function canOwnerOrAdminActing(req: AuthRequest): boolean {
  return req.user?.role === 'OWNER' || req.user?.role === 'ADMIN'
}

export async function listServiceAddOns(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ctx = getBusinessContextOrRespond(req, res)
    if (!ctx) return
    const items = await listServiceAddOnsForBusinessAdmin(ctx.businessId)
    return res.json(items)
  } catch (err) {
    next(err)
  }
}

export async function createServiceAddOn(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!canOwnerOrAdminActing(req)) {
      return res.status(403).json({ error: 'Solo el dueño o administrador puede crear adicionales.' })
    }
    const ctx = getBusinessContextOrRespond(req, res)
    if (!ctx) return
    const parsed = createServiceAddOnSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Error de validación',
        details: (parsed.error as ZodError).errors,
      })
    }
    const created = await createServiceAddOnForBusiness(ctx.businessId, parsed.data)
    return res.status(201).json(created)
  } catch (err) {
    if (err instanceof IndustryCapabilityError) {
      return res.status(403).json({ error: err.message })
    }
    next(err)
  }
}

export async function updateServiceAddOn(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!canOwnerOrAdminActing(req)) {
      return res.status(403).json({ error: 'Solo el dueño o administrador puede editar adicionales.' })
    }
    const ctx = getBusinessContextOrRespond(req, res)
    if (!ctx) return
    const id = req.params.id
    if (!id) return res.status(400).json({ error: 'ID requerido' })
    const parsed = updateServiceAddOnSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Error de validación',
        details: (parsed.error as ZodError).errors,
      })
    }
    const updated = await updateServiceAddOnForBusiness(ctx.businessId, id, parsed.data)
    return res.json(updated)
  } catch (err) {
    if (err instanceof IndustryCapabilityError) {
      return res.status(403).json({ error: err.message })
    }
    if (err instanceof ServiceAddOnNotFoundError) {
      return res.status(404).json({ error: err.message })
    }
    next(err)
  }
}

export async function deleteServiceAddOn(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!canOwnerOrAdminActing(req)) {
      return res.status(403).json({ error: 'Solo el dueño o administrador puede eliminar adicionales.' })
    }
    const ctx = getBusinessContextOrRespond(req, res)
    if (!ctx) return
    const id = req.params.id
    if (!id) return res.status(400).json({ error: 'ID requerido' })
    await deleteServiceAddOnForBusiness(ctx.businessId, id)
    return res.status(204).send()
  } catch (err) {
    if (err instanceof IndustryCapabilityError) {
      return res.status(403).json({ error: err.message })
    }
    if (err instanceof ServiceAddOnNotFoundError) {
      return res.status(404).json({ error: err.message })
    }
    next(err)
  }
}
