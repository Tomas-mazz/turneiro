import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { createSellerAdminSchema } from '../lib/schemas'
import {
  createSellerForAdmin,
  deleteSellerForAdmin,
  getSellerDetailForAdmin,
  listSellersForAdmin,
} from '../services/sellers.service'

export async function listSellers(_req: Request, res: Response, next: NextFunction) {
  try {
    const sellers = await listSellersForAdmin()
    res.json(sellers)
  } catch (err) {
    next(err)
  }
}

export async function createSeller(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createSellerAdminSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Error de validación',
        details: (parsed.error as ZodError).errors,
      })
    }
    const result = await createSellerForAdmin(parsed.data)
    res.status(201).json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al crear vendedor'
    if (message.includes('registrado')) {
      res.status(400).json({ error: message, field: 'email' })
      return
    }
    next(err)
  }
}

export async function getSellerDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id
    if (!id) return res.status(400).json({ error: 'ID de vendedor obligatorio' })
    const seller = await getSellerDetailForAdmin(id)
    if (!seller) return res.status(404).json({ error: 'Vendedor no encontrado' })
    res.json(seller)
  } catch (err) {
    next(err)
  }
}

export async function deleteSeller(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id
    if (!id) return res.status(400).json({ error: 'ID de vendedor obligatorio' })
    await deleteSellerForAdmin(id)
    res.status(204).send()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al eliminar vendedor'
    if (message.includes('no encontrado')) {
      res.status(404).json({ error: message })
      return
    }
    next(err)
  }
}

