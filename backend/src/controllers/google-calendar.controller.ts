import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import * as googleCalendarService from '../services/google-calendar.service'
import { resyncStaffUpcomingAppointmentsToOwnCalendar } from '../services/appointments.service'

/**
 * Initiate Google Calendar OAuth flow
 * Returns authorization URL for user to visit
 */
export async function initiateOAuth(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'No autenticado' })
    }

    const userId = req.user.userId
    const returnUrl = req.query.returnUrl as string | undefined
    const authUrl = googleCalendarService.getAuthUrl(userId, returnUrl)

    return res.json({
      authUrl,
      message: 'Visita esta URL para autorizar Google Calendar',
    })
  } catch (error) {
    console.error('initiateOAuth error:', error)
    return res.status(500).json({ error: 'Error al iniciar OAuth' })
  }
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

/**
 * OAuth callback - exchange code for tokens and save, then redirect to dashboard
 */
export async function oauthCallback(req: Request, res: Response) {
  let returnUrl = '/setting'

  try {
    const { code, state } = req.query

    if (!code || !state) {
      return res.redirect(`${FRONTEND_URL}/setting?google_calendar_error=1`)
    }

    // Parse state (JSON with userId and returnUrl)
    let userId: string
    try {
      const parsed = JSON.parse(state as string)
      userId = parsed.userId
      if (parsed.returnUrl) {
        returnUrl = parsed.returnUrl
      }
    } catch {
      // Fallback for old format (just userId string)
      userId = state as string
    }

    // Exchange code for tokens
    const { refreshToken } =
      await googleCalendarService.getTokensFromCode(code as string)

    if (!refreshToken) {
      const errorRedirect = returnUrl.startsWith('http')
        ? `${returnUrl}?google_calendar_error=2`
        : `${FRONTEND_URL}${returnUrl}?google_calendar_error=2`
      return res.redirect(errorRedirect)
    }

    // Get user's calendars to set default; fallback to 'primary' if list fails or is empty
    let calendarId: string = 'primary'
    try {
      const calendars = await googleCalendarService.listCalendars(refreshToken)
      const primaryCalendar = calendars?.find((cal) => cal.primary) || calendars?.[0]
      if (primaryCalendar?.id) {
        calendarId = primaryCalendar.id
      }
    } catch (listErr) {
      console.error('oauthCallback listCalendars fallback to primary:', listErr)
    }

    // Save refresh token and calendar ID to user
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleRefreshToken: refreshToken,
        googleCalendarId: calendarId,
      },
    })

    // If STAFF, re-sync their UPCOMING appointments to their calendar (don't block redirect)
    resyncStaffUpcomingAppointmentsToOwnCalendar(userId).catch((err) =>
      console.error('Resync staff calendar after OAuth:', err)
    )

    // Redirect to the original URL (could be full URL with subdomain or relative path)
    const successRedirect = returnUrl.startsWith('http')
      ? `${returnUrl}?google_calendar=connected`
      : `${FRONTEND_URL}${returnUrl}?google_calendar=connected`
    return res.redirect(successRedirect)
  } catch (error) {
    console.error('oauthCallback error:', error)
    const errorRedirect = returnUrl.startsWith('http')
      ? `${returnUrl}?google_calendar_error=1`
      : `${FRONTEND_URL}${returnUrl}?google_calendar_error=1`
    return res.redirect(errorRedirect)
  }
}

/**
 * Disconnect Google Calendar
 */
export async function disconnectCalendar(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'No autenticado' })
    }

    await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        googleRefreshToken: null,
        googleCalendarId: null,
      },
    })

    return res.json({
      success: true,
      message: 'Google Calendar desconectado',
    })
  } catch (error) {
    console.error('disconnectCalendar error:', error)
    return res.status(500).json({ error: 'Error al desconectar calendar' })
  }
}

/**
 * Get Google Calendar connection status
 */
export async function getConnectionStatus(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'No autenticado' })
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        googleRefreshToken: true,
        googleCalendarId: true,
      },
    })

    const isConnected = !!user?.googleRefreshToken

    return res.json({
      connected: isConnected,
      calendarId: isConnected ? user?.googleCalendarId : null,
    })
  } catch (error) {
    console.error('getConnectionStatus error:', error)
    return res.status(500).json({ error: 'Error al obtener estado' })
  }
}

/**
 * Manually sync appointment to Google Calendar
 */
export async function syncAppointment(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'No autenticado' })
    }

    const { appointmentId } = req.body

    if (!appointmentId) {
      return res.status(400).json({ error: 'appointmentId requerido' })
    }

    // Get user with Google Calendar credentials
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    })

    const refreshToken = user?.googleRefreshToken
    const calendarId = user?.googleCalendarId

    if (!refreshToken || !calendarId) {
      return res.status(400).json({
        error: 'Google Calendar no está conectado',
      })
    }

    // Get appointment (with employee for "con X" summary when owner)
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        businessId: req.user.businessId,
      },
      include: {
        business: true,
        employee: true,
      },
    })

    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' })
    }

    const isOwner = req.user.role === 'OWNER'
    const isOwnerSlot = !appointment.employee || appointment.employee.isOwner
    const summary = isOwner
      ? `${appointment.serviceName} - ${appointment.clientName} (con ${isOwnerSlot ? 'dueño' : appointment.employee!.name})`
      : `${appointment.serviceName} - ${appointment.clientName}`

    // Create or update event
    const existingEventId = appointment.googleEventId

    if (existingEventId) {
      await googleCalendarService.updateCalendarEvent(
        refreshToken,
        calendarId,
        existingEventId,
        {
          summary,
          description: `Cliente: ${appointment.clientName}\nTeléfono: ${appointment.clientPhone}\nPrecio: $${appointment.price}`,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
        }
      )
    } else {
      const eventId = await googleCalendarService.createCalendarEvent(
        refreshToken,
        calendarId,
        {
          summary,
          description: `Cliente: ${appointment.clientName}\nTeléfono: ${appointment.clientPhone}\nPrecio: $${appointment.price}\nEstado: ${appointment.status}`,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          location: appointment.business.name,
        }
      )

      await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          googleEventId: eventId,
        },
      })
    }

    return res.json({
      success: true,
      message: 'Cita sincronizada con Google Calendar',
    })
  } catch (error) {
    console.error('syncAppointment error:', error)
    return res.status(500).json({ error: 'Error al sincronizar cita' })
  }
}
