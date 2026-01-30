import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import {
  initiateOAuth,
  oauthCallback,
  disconnectCalendar,
  getConnectionStatus,
  syncAppointment,
} from '../controllers/google-calendar.controller'

const router = Router()

// Initiate OAuth flow (protected)
router.get('/auth', requireAuth, initiateOAuth)

// OAuth callback (public - receives code from Google)
router.get('/callback', oauthCallback)

// Disconnect Google Calendar (protected)
router.post('/disconnect', requireAuth, disconnectCalendar)

// Get connection status (protected)
router.get('/status', requireAuth, getConnectionStatus)

// Manually sync appointment to Google Calendar (protected)
router.post('/sync-appointment', requireAuth, syncAppointment)

export default router
