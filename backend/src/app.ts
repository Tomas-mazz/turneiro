import path from 'path'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true)
      if (origin === FRONTEND_URL) return callback(null, true)
      if (origin.startsWith('http://') && origin.endsWith('.localhost:3000')) {
        return callback(null, true)
      }
      if (origin.startsWith('https://') && origin.endsWith('.turneros.com')) {
        return callback(null, true)
      }
      if (origin.startsWith('https://') && origin.endsWith('.turneiro.com')) {
        return callback(null, true)
      }
      return callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
  }),
)

import webhooksRoutes from './routes/webhooks'
app.use('/api/webhooks', webhooksRoutes)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check (Vercel and load balancers often hit /api/health)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend API is running' })
})
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend API is running' })
})

// API Routes
import businessesRoutes from './routes/businesses'
import availabilityRoutes from './routes/availability'
import appointmentsRoutes from './routes/appointments'
import servicesRoutes from './routes/services'
import authRoutes from './routes/auth'
import paymentsRoutes from './routes/payments'
import googleCalendarRoutes from './routes/google-calendar'
import blockedSlotsRoutes from './routes/blockedSlots'
import workingHoursRoutes from './routes/workingHours'
import adminRoutes from './routes/admin'
import uploadRoutes from './routes/upload'
app.use('/api/businesses', businessesRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/admin/upload', uploadRoutes)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))
app.use('/api/availability', availabilityRoutes)
app.use('/api/appointments', appointmentsRoutes)
app.use('/api/services', servicesRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/payments', paymentsRoutes)
app.use('/api/google-calendar', googleCalendarRoutes)
app.use('/api/blocked-slots', blockedSlotsRoutes)
app.use('/api/working-hours', workingHoursRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handler
import { errorHandler } from './middleware/errorHandler'
app.use(errorHandler)

export default app
