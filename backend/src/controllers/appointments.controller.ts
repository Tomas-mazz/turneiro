import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import {
  createAppointmentService,
  cancelAppointmentService,
  getAppointmentsService,
  getAppointmentsByPhoneService,
  cancelAppointmentByOwnerService,
  SlotUnavailableError,
  CancellationNotAllowedError,
} from '../services/appointments.service'
import { getEmployeeIdByUserIdService } from '../services/employees.service'
import {
  createAppointmentSchema,
  cancelAppointmentSchema,
  ownerCancelAppointmentSchema,
} from '../lib/schemas'
import type { AuthRequest } from '../middleware/auth'

export async function createAppointment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = createAppointmentSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Error de validación',
        details: (parsed.error as ZodError).errors,
      })
    }
    const result = await createAppointmentService(parsed.data)
    return res.status(201).json(result)
  } catch (err) {
    if (err instanceof SlotUnavailableError) {
      return res.status(409).json({ error: err.message })
    }
    next(err)
  }
}

export async function getAppointments(req: AuthRequest, res: Response) {
  const businessId = req.user?.businessId
  if (!businessId) {
    return res.status(403).json({
      error: 'No tienes un negocio asignado',
    })
  }
  let staffEmployeeId: string | null | undefined
  if (req.user?.role === 'STAFF' && req.user?.userId) {
    staffEmployeeId = await getEmployeeIdByUserIdService(req.user.userId, businessId)
    if (staffEmployeeId === null) {
      // STAFF sin empleado asociado: no tiene turnos propios
      return res.json([])
    }
  } else {
    staffEmployeeId = undefined
  }
  const appointments = await getAppointmentsService(businessId, staffEmployeeId)
  return res.json(appointments)
}

export async function getAppointmentLookup(
  req: AuthRequest,
  res: Response
) {
  const businessId = req.user?.businessId
  if (!businessId) {
    return res.status(403).json({
      error: 'No tienes un negocio asignado',
    })
  }
  const phone = typeof req.query.phone === 'string' ? req.query.phone : ''
  if (!phone.trim()) {
    return res.status(400).json({
      error: 'Falta el teléfono del cliente',
    })
  }
  let staffEmployeeId: string | null | undefined
  if (req.user?.role === 'STAFF' && req.user?.userId) {
    staffEmployeeId = await getEmployeeIdByUserIdService(req.user.userId, businessId)
    if (staffEmployeeId === null) {
      return res.json([])
    }
  } else {
    staffEmployeeId = undefined
  }
  const appointments = await getAppointmentsByPhoneService(
    businessId,
    phone,
    staffEmployeeId
  )
  if (appointments.length === 0) {
    return res.status(404).json({
      error: 'No hay reservas próximas para ese teléfono',
    })
  }
  return res.json(appointments)
}

export async function cancelAppointmentByOwner(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const businessId = req.user?.businessId
    if (!businessId) {
      return res.status(403).json({
        error: 'No tienes un negocio asignado',
      })
    }
    const parsed = ownerCancelAppointmentSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Error de validación',
        details: (parsed.error as ZodError).errors,
      })
    }
    const appointmentId = req.params.id
    let staffEmployeeId: string | null | undefined
    if (req.user?.role === 'STAFF' && req.user?.userId) {
      staffEmployeeId = await getEmployeeIdByUserIdService(req.user.userId, businessId)
    } else {
      staffEmployeeId = undefined
    }
    const result = await cancelAppointmentByOwnerService(
      appointmentId,
      businessId,
      parsed.data.reason,
      staffEmployeeId
    )
    return res.status(200).json(result)
  } catch (err) {
    if (err instanceof CancellationNotAllowedError) {
      return res.status(400).json({ error: err.message })
    }
    next(err)
  }
}

export async function cancelAppointment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = cancelAppointmentSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Error de validación',
        details: (parsed.error as ZodError).errors,
      })
    }
    const result = await cancelAppointmentService(parsed.data.token)
    return res.status(200).json(result)
  } catch (err) {
    if (err instanceof CancellationNotAllowedError) {
      return res.status(400).json({ error: err.message })
    }
    next(err)
  }
}
