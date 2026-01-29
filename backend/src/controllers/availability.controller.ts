import { Request, Response, NextFunction } from 'express'
import { getAvailabilityService, getWeekAvailabilityService } from '../services/availability.service'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

export async function getAvailability(req: Request, res: Response, next: NextFunction) {
  try {
    const { businessSlug, serviceId, date: dateStr } = req.query as {
      businessSlug?: string
      serviceId?: string
      date?: string
    }
    if (!businessSlug?.trim() || !serviceId?.trim() || !dateStr?.trim()) {
      res.status(400).json({
        error: 'Faltan parámetros: businessSlug, serviceId, date (AAAA-MM-DD)',
      })
      return
    }
    if (!DATE_REGEX.test(dateStr)) {
      res.status(400).json({ error: 'date debe ser AAAA-MM-DD' })
      return
    }
    const date = new Date(dateStr + 'T12:00:00')
    if (Number.isNaN(date.getTime())) {
      res.status(400).json({ error: 'Fecha inválida' })
      return
    }
    const slots = await getAvailabilityService(businessSlug.trim(), serviceId.trim(), date)
    res.json({ slots })
  } catch (err) {
    next(err)
  }
}

export async function getWeekAvailability(req: Request, res: Response, next: NextFunction) {
  try {
    const { businessSlug, serviceId, startDate: startDateStr } = req.query as {
      businessSlug?: string
      serviceId?: string
      startDate?: string
    }
    if (!businessSlug?.trim() || !serviceId?.trim() || !startDateStr?.trim()) {
      res.status(400).json({
        error: 'Faltan parámetros: businessSlug, serviceId, startDate (AAAA-MM-DD)',
      })
      return
    }
    if (!DATE_REGEX.test(startDateStr)) {
      res.status(400).json({ error: 'startDate debe ser AAAA-MM-DD' })
      return
    }
    const startDate = new Date(startDateStr + 'T12:00:00')
    if (Number.isNaN(startDate.getTime())) {
      res.status(400).json({ error: 'Fecha de inicio inválida' })
      return
    }
    const week = await getWeekAvailabilityService(
      businessSlug.trim(),
      serviceId.trim(),
      startDate
    )
    res.json({ week })
  } catch (err) {
    next(err)
  }
}
