import type { Response, NextFunction } from 'express'
import type { AuthRequest } from '../middleware/auth'
import { ZodError } from 'zod'
import {
  createBusinessSellerSchema,
  updateBusinessSellerSchema,
} from '../lib/schemas'
import {
  createBusinessForSeller,
  getBusinessForSeller,
  listBusinessesForSeller,
  updateBusinessForSeller,
} from '../services/sellerBusinesses.service'

export async function listSellerBusinesses(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ error: 'No autenticado' })
    const businesses = await listBusinessesForSeller(userId)
    res.json(businesses)
  } catch (err) {
    next(err)
  }
}

export async function getSellerBusiness(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId
    const id = req.params.id
    if (!userId) return res.status(401).json({ error: 'No autenticado' })
    if (!id) return res.status(400).json({ error: 'ID de negocio obligatorio' })
    const business = await getBusinessForSeller(userId, id)
    if (!business) return res.status(404).json({ error: 'Negocio no encontrado' })
    res.json(business)
  } catch (err) {
    next(err)
  }
}

export async function createSellerBusiness(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ error: 'No autenticado' })
    const parsed = createBusinessSellerSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Error de validación',
        details: (parsed.error as ZodError).errors,
      })
    }

    const body = parsed.data
    const result = await createBusinessForSeller(userId, {
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
      coverPhotoMobile: body.coverPhotoMobile,
      coverVideoMobile: body.coverVideoMobile,
      theme: body.theme,
      ownerName: body.ownerName,
      ownerEmail: body.ownerEmail,
      ownerPassword: body.ownerPassword,
    })
    res.status(201).json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al crear el negocio'
    if (message.includes('slug') || message.includes('email')) {
      const field = message.toLowerCase().includes('slug') ? 'slug' : 'ownerEmail'
      res.status(400).json({ error: message, field })
      return
    }
    next(err)
  }
}

export async function updateSellerBusiness(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId
    const id = req.params.id
    if (!userId) return res.status(401).json({ error: 'No autenticado' })
    if (!id) return res.status(400).json({ error: 'ID de negocio obligatorio' })

    const parsed = updateBusinessSellerSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Error de validación',
        details: (parsed.error as ZodError).errors,
      })
    }

    await updateBusinessForSeller(userId, id, parsed.data)
    res.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al actualizar el negocio'
    if (message.includes('slug') || message.includes('email') || message.includes('no encontrado')) {
      const status = message.includes('no encontrado') ? 404 : 400
      const field =
        message.includes('no encontrado')
          ? undefined
          : message.toLowerCase().includes('slug')
            ? 'slug'
            : 'ownerEmail'
      res.status(status).json({ error: message, ...(field && { field }) })
      return
    }
    next(err)
  }
}

