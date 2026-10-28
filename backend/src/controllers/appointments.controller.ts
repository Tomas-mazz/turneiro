import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import {
  createAppointmentService,
  holdAppointmentForCheckoutService,
  completeCheckoutService,
  CheckoutError,
  cancelAppointmentService,
  getAppointmentsService,
  getAppointmentsByPhoneService,
  cancelAppointmentByOwnerService,
  getAppointmentByTokenService,
  SlotUnavailableError,
  CancellationNotAllowedError,
} from '../services/appointments.service'
import {
  createAppointmentSchema,
  holdAppointmentSchema,
  completeCheckoutSchema,
  cancelAppointmentSchema,
  ownerCancelAppointmentSchema,
} from '../lib/schemas'
import type { AuthRequest } from '../middleware/auth'
import { getBusinessContextOrRespond } from '../lib/requestGuards'

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

/** Checkout step 1: hold the slot while the client fills in their details and pays. */
export async function holdAppointment(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = holdAppointmentSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Error de validación', details: parsed.error.errors })
    }
    return res.status(201).json(await holdAppointmentForCheckoutService(parsed.data))
  } catch (err) {
    if (err instanceof SlotUnavailableError) {
      return res.status(409).json({ error: err.message })
    }
    next(err)
  }
}

/** Checkout step 2: client details + pay online or at the shop. */
export async function completeCheckout(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = completeCheckoutSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Error de validación', details: parsed.error.errors })
    }
    return res.json(await completeCheckoutService(req.params.id, parsed.data))
  } catch (err) {
    if (err instanceof CheckoutError) {
      return res.status(err.status).json({ error: err.message })
    }
    next(err)
  }
}

export async function getAppointments(req: AuthRequest, res: Response) {
  const ctx = getBusinessContextOrRespond(req, res)
  if (!ctx) return
  const { businessId, staffEmployeeId } = ctx
  if (staffEmployeeId === null) {
    return res.json([])
  }
  const appointments = await getAppointmentsService(businessId, staffEmployeeId)
  return res.json(appointments)
}

export async function getAppointmentLookup(
  req: AuthRequest,
  res: Response
) {
  const ctx = getBusinessContextOrRespond(req, res)
  if (!ctx) return
  const { businessId, staffEmployeeId } = ctx
  const phone = typeof req.query.phone === 'string' ? req.query.phone : ''
  if (!phone.trim()) {
    return res.status(400).json({
      error: 'Falta el teléfono del cliente',
    })
  }
  if (staffEmployeeId === null) {
    return res.json([])
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
    const ctx = getBusinessContextOrRespond(req, res)
    if (!ctx) return
    const { businessId, staffEmployeeId } = ctx
    const parsed = ownerCancelAppointmentSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Error de validación',
        details: (parsed.error as ZodError).errors,
      })
    }
    const appointmentId = req.params.id
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

export async function getAppointmentByToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.params.token
    if (!token) {
      return res.status(400).json({ error: 'Token requerido' })
    }
    const appointment = await getAppointmentByTokenService(token)
    if (!appointment) {
      return res.status(404).json({ error: 'Turno no encontrado' })
    }
    return res.json(appointment)
  } catch (err) {
    next(err)
  }
}
