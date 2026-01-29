import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import {
  createAppointmentService,
  cancelAppointmentService,
  SlotUnavailableError,
  CancellationNotAllowedError,
} from '../services/appointments.service'
import {
  createAppointmentSchema,
  cancelAppointmentSchema,
} from '../lib/schemas'

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

export async function getAppointments(req: Request, res: Response) {
  // TODO: Implement for dashboard (auth required)
  res.json({ message: 'Not implemented' })
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
