import type { Response, NextFunction } from 'express'
import type { BusinessContextRequest } from '../middleware/businessContext'
import {
  createOwnerEmployeeService,
  deleteOwnerEmployeeService,
  getOwnerCalendarColorService,
  listOwnerEmployeesService,
  OwnerEmployeeNotFoundError,
  OwnerEmployeeOperationNotAllowedError,
  updateOwnerCalendarColorService,
  updateOwnerEmployeeService,
} from '../services/ownerEmployees.service'

export async function listOwnerEmployees(
  req: unknown,
  res: Response,
  next: NextFunction
) {
  try {
    const r = req as BusinessContextRequest
    const { businessId } = r.businessContext
    const userId = r.user?.userId
    if (!userId) return res.status(401).json({ error: 'No autenticado' })

    const list = await listOwnerEmployeesService({
      businessId,
      ownerUserId: r.user?.role === 'OWNER' ? userId : undefined,
    })
    res.json(list)
  } catch (err) {
    next(err)
  }
}

export async function getOwnerCalendarColor(req: unknown, res: Response, next: NextFunction) {
  try {
    const r = req as BusinessContextRequest
    const { businessId } = r.businessContext
    const userId = r.user?.userId
    if (!userId) return res.status(401).json({ error: 'No autenticado' })
    const payload = await getOwnerCalendarColorService({
      businessId,
      ownerUserId: r.user?.role === 'OWNER' ? userId : undefined,
    })
    res.json(payload)
  } catch (err) {
    next(err)
  }
}

export async function updateOwnerCalendarColor(req: unknown, res: Response, next: NextFunction) {
  try {
    const r = req as BusinessContextRequest
    const { businessId } = r.businessContext
    const userId = r.user?.userId
    if (!userId) return res.status(401).json({ error: 'No autenticado' })
    const body = r.body as { ownerCalendarColorId?: string | null }
    const updated = await updateOwnerCalendarColorService({
      businessId,
      ownerUserId: r.user?.role === 'OWNER' ? userId : undefined,
      ownerCalendarColorId: body.ownerCalendarColorId ?? null,
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

export async function createOwnerEmployee(
  req: unknown,
  res: Response,
  next: NextFunction
) {
  try {
    const r = req as BusinessContextRequest
    const { businessId } = r.businessContext
    const body = r.body as {
      name: string
      photoUrl?: string | null
      staffEmail: string
      staffPassword: string
      ownerCalendarColorId?: string | null
    }

    const created = await createOwnerEmployeeService({
      businessId,
      name: body.name,
      photoUrl: body.photoUrl ?? null,
      staffEmail: body.staffEmail,
      staffPassword: body.staffPassword,
      ownerCalendarColorId: body.ownerCalendarColorId ?? null,
    })
    res.status(201).json(created)
  } catch (err) {
    if (err instanceof OwnerEmployeeOperationNotAllowedError) {
      return res.status(400).json({ error: err.message })
    }
    next(err)
  }
}

export async function updateOwnerEmployee(
  req: unknown,
  res: Response,
  next: NextFunction
) {
  try {
    const r = req as BusinessContextRequest
    const { businessId } = r.businessContext
    const employeeId = String(r.params.id ?? '').trim()
    if (!employeeId) return res.status(400).json({ error: 'ID de empleado obligatorio' })

    const body = r.body as {
      name?: string
      photoUrl?: string | null
      ownerCalendarColorId?: string | null
      bio?: string | null
      staffEmail?: string
      staffPassword?: string
    }

    const updated = await updateOwnerEmployeeService({
      businessId,
      employeeId,
      name: body.name,
      photoUrl: body.photoUrl,
      ownerCalendarColorId: body.ownerCalendarColorId,
      bio: body.bio,
      staffEmail: body.staffEmail,
      staffPassword: body.staffPassword,
    })
    res.json(updated)
  } catch (err) {
    if (err instanceof OwnerEmployeeNotFoundError) {
      return res.status(404).json({ error: err.message })
    }
    if (err instanceof OwnerEmployeeOperationNotAllowedError) {
      return res.status(400).json({ error: err.message })
    }
    next(err)
  }
}

export async function deleteOwnerEmployee(
  req: unknown,
  res: Response,
  next: NextFunction
) {
  try {
    const r = req as BusinessContextRequest
    const { businessId } = r.businessContext
    const employeeId = String(r.params.id ?? '').trim()
    if (!employeeId) return res.status(400).json({ error: 'ID de empleado obligatorio' })

    await deleteOwnerEmployeeService({ businessId, employeeId })
    res.status(204).send()
  } catch (err) {
    if (err instanceof OwnerEmployeeNotFoundError) {
      return res.status(404).json({ error: err.message })
    }
    if (err instanceof OwnerEmployeeOperationNotAllowedError) {
      return res.status(400).json({ error: err.message })
    }
    next(err)
  }
}

