import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import * as googleCalendarService from '../services/google-calendar.service'

/**
 * Initiate Google Calendar OAuth flow
 * Returns authorization URL for user to visit
 */
export async function initiateOAuth(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'No autenticado' })
    }

    const userId = req.user.id
    const authUrl = googleCalendarService.getAuthUrl(userId)

    return res.json({
      authUrl,
      message: 'Visita esta URL para autorizar Google Calendar',
    })
  } catch (error) {
    console.error('initiateOAuth error:', error)
    return res.status(500).json({ error: 'Error al iniciar OAuth' })
  }
}

/**
 * OAuth callback - exchange code for tokens and save
 */
export async function oauthCallback(req: Request, res: Response) {
  try {
    const { code, state } = req.query

    if (!code || !state) {
      return res.status(400).json({ error: 'Código o estado faltante' })
    }

    const userId = state as string

    // Exchange code for tokens
    const { accessToken, refreshToken } =
      await googleCalendarService.getTokensFromCode(code as string)

    if (!refreshToken) {
      return res.status(400).json({
        error: 'No se recibió refresh token. Intenta revocar el acceso y autorizar de nuevo.',
      })
    }

    // Get user's calendars to set default
    const calendars = await googleCalendarService.listCalendars(refreshToken)
    const primaryCalendar = calendars.find(cal => cal.primary) || calendars[0]

    if (!primaryCalendar) {
      return res.status(400).json({
        error: 'No se encontró calendario. Asegúrate de tener Google Calendar habilitado.',
      })
    }

    // Save refresh token and calendar ID to user
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleRefreshToken: refreshToken as any,
        googleCalendarId: primaryCalendar.id as any,
      } as any,
    })

    return res.json({
      success: true,
      message: 'Google Calendar conectado exitosamente',
      calendarName: primaryCalendar.summary,
    })
  } catch (error) {
    console.error('oauthCallback error:', error)
    return res.status(500).json({ error: 'Error al procesar callback de OAuth' })
  }
}

/**
 * Disconnect Google Calendar
 */
export async function disconnectCalendar(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'No autenticado' })
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        googleRefreshToken: null as any,
        googleCalendarId: null as any,
      } as any,
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
    if (!req.user?.id) {
      return res.status(401).json({ error: 'No autenticado' })
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        googleRefreshToken: true,
        googleCalendarId: true,
      },
    })

    const isConnected = !!(user as any)?.googleRefreshToken

    return res.json({
      connected: isConnected,
      calendarId: isConnected ? (user as any)?.googleCalendarId : null,
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
    if (!req.user?.id) {
      return res.status(401).json({ error: 'No autenticado' })
    }

    const { appointmentId } = req.body

    if (!appointmentId) {
      return res.status(400).json({ error: 'appointmentId requerido' })
    }

    // Get user with Google Calendar credentials
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    })

    const refreshToken = (user as any)?.googleRefreshToken
    const calendarId = (user as any)?.googleCalendarId

    if (!refreshToken || !calendarId) {
      return res.status(400).json({
        error: 'Google Calendar no está conectado',
      })
    }

    // Get appointment
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        businessId: req.user.businessId,
      },
      include: {
        business: true,
      },
    })

    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' })
    }

    // Create or update event
    const existingEventId = (appointment as any).googleEventId

    if (existingEventId) {
      // Update existing event
      await googleCalendarService.updateCalendarEvent(
        refreshToken,
        calendarId,
        existingEventId,
        {
          summary: `${appointment.serviceName} - ${appointment.clientName}`,
          description: `Cliente: ${appointment.clientName}\nTeléfono: ${appointment.clientPhone}\nPrecio: $${appointment.price}`,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
        }
      )
    } else {
      // Create new event
      const eventId = await googleCalendarService.createCalendarEvent(
        refreshToken,
        calendarId,
        {
          summary: `${appointment.serviceName} - ${appointment.clientName}`,
          description: `Cliente: ${appointment.clientName}\nTeléfono: ${appointment.clientPhone}\nPrecio: $${appointment.price}\nEstado: ${appointment.status}`,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          location: appointment.business.name,
        }
      )

      // Save event ID to appointment
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          googleEventId: eventId as any,
        } as any,
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
