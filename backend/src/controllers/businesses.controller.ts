import { Request, Response, NextFunction } from 'express'
import { getBusinessBySlugService } from '../services/businesses.service'

export async function getBusinessBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = req.params.slug
    if (!slug) {
      res.status(400).json({ error: 'El slug es obligatorio' })
      return
    }
    const business = await getBusinessBySlugService(slug)
    if (!business) {
      res.status(404).json({ error: 'Negocio no encontrado' })
      return
    }
    res.json(business)
  } catch (err) {
    next(err)
  }
}

export async function getBusinesses(req: Request, res: Response) {
  // TODO: Implement
  res.json({ message: 'Not implemented' })
}
