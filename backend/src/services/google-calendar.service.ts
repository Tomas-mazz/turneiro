import { google, calendar_v3 } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be defined')
}

const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/google-calendar/callback'

/**
 * Create OAuth2 client
 */
export function createOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  )
}

/**
 * Get authorization URL for OAuth flow
 * @param userId - User ID to associate with OAuth
 * @param returnUrl - URL to redirect back to after OAuth completes
 */
export function getAuthUrl(userId: string, returnUrl?: string): string {
  const oauth2Client = createOAuth2Client()
  
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ]

  const state = JSON.stringify({
    userId,
    returnUrl: returnUrl || '/setting',
  })

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state,
    prompt: 'consent', // Force consent to get refresh token
  })
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string): Promise<{
  accessToken: string
  refreshToken?: string
}> {
  const oauth2Client = createOAuth2Client()
  
  try {
    const { tokens } = await oauth2Client.getToken(code)
    
    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token ?? undefined,
    }
  } catch (error) {
    console.error('Error getting tokens from code:', error)
    throw new Error('Failed to exchange authorization code')
  }
}

/**
 * Create OAuth2 client with refresh token
 */
export function createAuthenticatedClient(refreshToken: string): OAuth2Client {
  const oauth2Client = createOAuth2Client()
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  })
  return oauth2Client
}

/**
 * Create a calendar event
 */
export async function createCalendarEvent(
  refreshToken: string,
  calendarId: string,
  event: {
    summary: string
    description?: string
    startTime: Date
    endTime: Date
    location?: string
    attendees?: string[]
    colorId?: string // Google Calendar color 1-11; used for owner view (staff events in different color)
  }
): Promise<string> {
  try {
    const auth = createAuthenticatedClient(refreshToken)
    const calendar = google.calendar({ version: 'v3', auth })

    const response = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: event.summary,
        description: event.description,
        location: event.location,
        ...(event.colorId ? { colorId: event.colorId } : {}),
        start: {
          dateTime: event.startTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: event.endTime.toISOString(),
          timeZone: 'UTC',
        },
        attendees: event.attendees?.map(email => ({ email })),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 24 * 60 }, // 24 hours before
            { method: 'popup', minutes: 120 }, // 2 hours before
          ],
        },
      },
    })

    if (!response.data.id) {
      throw new Error('Event created but no ID returned')
    }

    return response.data.id
  } catch (error) {
    console.error('Error creating calendar event:', error)
    throw new Error('Failed to create calendar event')
  }
}

/**
 * Update a calendar event
 */
export async function updateCalendarEvent(
  refreshToken: string,
  calendarId: string,
  eventId: string,
  event: {
    summary?: string
    description?: string
    startTime?: Date
    endTime?: Date
    location?: string
  }
): Promise<void> {
  try {
    const auth = createAuthenticatedClient(refreshToken)
    const calendar = google.calendar({ version: 'v3', auth })

    const updateData: calendar_v3.Schema$Event = {}
    if (event.summary) updateData.summary = event.summary
    if (event.description) updateData.description = event.description
    if (event.location) updateData.location = event.location
    if (event.startTime) {
      updateData.start = {
        dateTime: event.startTime.toISOString(),
        timeZone: 'UTC',
      }
    }
    if (event.endTime) {
      updateData.end = {
        dateTime: event.endTime.toISOString(),
        timeZone: 'UTC',
      }
    }

    await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: updateData,
    })
  } catch (error) {
    console.error('Error updating calendar event:', error)
    throw new Error('Failed to update calendar event')
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(
  refreshToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  try {
    const auth = createAuthenticatedClient(refreshToken)
    const calendar = google.calendar({ version: 'v3', auth })

    await calendar.events.delete({
      calendarId,
      eventId,
    })
  } catch (error) {
    console.error('Error deleting calendar event:', error)
    throw new Error('Failed to delete calendar event')
  }
}

/**
 * Get calendar event details
 */
export async function getCalendarEvent(
  refreshToken: string,
  calendarId: string,
  eventId: string
): Promise<calendar_v3.Schema$Event> {
  try {
    const auth = createAuthenticatedClient(refreshToken)
    const calendar = google.calendar({ version: 'v3', auth })

    const response = await calendar.events.get({
      calendarId,
      eventId,
    })

    return response.data
  } catch (error) {
    console.error('Error getting calendar event:', error)
    throw new Error('Failed to get calendar event')
  }
}

/**
 * List calendars for user
 */
export async function listCalendars(
  refreshToken: string
): Promise<calendar_v3.Schema$CalendarListEntry[]> {
  try {
    const auth = createAuthenticatedClient(refreshToken)
    const calendar = google.calendar({ version: 'v3', auth })

    const response = await calendar.calendarList.list()

    return response.data.items || []
  } catch (error) {
    console.error('Error listing calendars:', error)
    throw new Error('Failed to list calendars')
  }
}
