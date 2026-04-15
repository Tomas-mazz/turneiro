import { Request, Response, NextFunction } from 'express'
import { getAvailabilityService, getWeekAvailabilityService } from '../services/availability.service'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

export async function getAvailability(req: Request, res: Response, next: NextFunction) {
  try {
    const { businessSlug, serviceId, serviceIds, date: dateStr, employeeId } = req.query as {
      businessSlug?: string
      serviceId?: string
      serviceIds?: string
      date?: string
      employeeId?: string
    }
    const hasSingle = !!serviceId?.trim()
    const hasMany = !!serviceIds?.trim()
    if (!businessSlug?.trim() || !(hasSingle || hasMany) || !dateStr?.trim()) {
      res.status(400).json({
        error: 'Faltan parámetros: businessSlug, serviceId/serviceIds, date (AAAA-MM-DD)',
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
    const resolvedServiceIds = hasMany
      ? serviceIds!
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : null
    const serviceParam = resolvedServiceIds && resolvedServiceIds.length > 0 ? resolvedServiceIds : serviceId!.trim()
    const slots = await getAvailabilityService(
      businessSlug.trim(),
      serviceParam,
      date,
      dateStr,
      employeeId?.trim() || undefined
    )
    res.json({ slots })
  } catch (err) {
    next(err)
  }
}

export async function getWeekAvailability(req: Request, res: Response, next: NextFunction) {
  try {
    const { businessSlug, serviceId, serviceIds, startDate: startDateStr } = req.query as {
      businessSlug?: string
      serviceId?: string
      serviceIds?: string
      startDate?: string
    }
    const hasSingle = !!serviceId?.trim()
    const hasMany = !!serviceIds?.trim()
    if (!businessSlug?.trim() || !(hasSingle || hasMany) || !startDateStr?.trim()) {
      res.status(400).json({
        error: 'Faltan parámetros: businessSlug, serviceId/serviceIds, startDate (AAAA-MM-DD)',
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
    const resolvedServiceIds = hasMany
      ? serviceIds!
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : null
    const serviceParam = resolvedServiceIds && resolvedServiceIds.length > 0 ? resolvedServiceIds : serviceId!.trim()
    const week = await getWeekAvailabilityService(
      businessSlug.trim(),
      serviceParam,
      startDate
    )
    res.json({ week })
  } catch (err) {
    next(err)
  }
}
