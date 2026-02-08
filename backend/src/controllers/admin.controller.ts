import { Request, Response, NextFunction } from 'express'
import {
  getAllBusinessesForAdmin,
  getBusinessByIdForAdmin,
  createBusinessForAdmin,
  updateBusinessForAdmin,
} from '../services/businesses.service'
import type { AuthRequest } from '../middleware/auth'

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
