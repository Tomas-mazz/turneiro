# Architecture & System Design

## Architecture Overview

The project uses a **separated frontend and backend architecture** for better scalability and maintainability.

### Project Structure

```
Appointments/
├── frontend/          # Next.js 14+ (UI only, no API routes)
├── backend/           # Express.js + TypeScript + Prisma (REST API)
└── docs/              # Project documentation
```

## Backend Architecture

### Express.js REST API

**Backend Structure:**
```
backend/
├── src/
│   ├── routes/              # API route definitions
│   │   ├── appointments.ts
│   │   ├── availability.ts
│   │   ├── businesses.ts
│   │   └── webhooks.ts
│   ├── controllers/         # Request handlers
│   ├── services/            # Business logic
│   ├── middleware/          # Auth, validation, etc.
│   ├── lib/
│   │   └── prisma.ts        # Prisma client singleton
│   └── index.ts             # Express server entry point
└── prisma/
    ├── schema.prisma        # Database schema
    └── migrations/          # Migration files
```

**API Route Structure:**
```
/api/businesses
  GET    /api/businesses/:slug          # Get public business profile
  GET    /api/businesses                # Get businesses (admin)

/api/appointments
  GET    /api/appointments              # Get appointments
  POST   /api/appointments               # Create appointment
  GET    /api/appointments/:id          # Get specific appointment
  PUT    /api/appointments/:id          # Update appointment
  DELETE /api/appointments/:id          # Delete appointment
  POST   /api/appointments/cancel       # Cancel appointment

/api/availability
  GET    /api/availability               # Get available time slots
  GET    /api/availability/week         # Get week availability

/api/webhooks
  POST   /api/webhooks/stripe           # Stripe webhook
  POST   /api/webhooks/twilio           # Twilio webhook
```

### Data Flow Architecture

```
Client Request (Frontend)
  ↓
Next.js Frontend (UI only)
  ↓
HTTP Request to Backend API
  ↓
Express.js Middleware (CORS, Auth Check)
  ↓
Route Handler
  ↓
Controller
  ↓
Service Layer (Business Logic)
  ↓
Prisma ORM
  ↓
PostgreSQL Database
  ↓
Response Back to Frontend
  ↓
Next.js Renders UI
```

## Database Schema

### Entity Relationship Diagram

```
Business
  ├── One-to-Many: Users (authentication)
  ├── One-to-Many: Appointments
  ├── One-to-Many: Services
  ├── One-to-Many: WorkingHours
  ├── One-to-Many: BlockedSlots
  ├── One-to-One: BusinessSettings
  └── One-to-One: Subscription

User
  ├── Many-to-One: Business
  └── Fields: email, password, role (OWNER, ADMIN, STAFF)

Service
  ├── Many-to-One: Business
  └── Fields: name, price, duration, isActive

Appointment
  ├── Many-to-One: Business
  ├── Many-to-One: Service (optional)
  └── Fields: startTime, endTime, serviceName, price, paymentStatus, clientName, clientPhone, status

WorkingHours
  └── Many-to-One: Business
       └── Fields: dayOfWeek, startTime, endTime, isClosed

BlockedSlot
  └── Many-to-One: Business
       └── Fields: date, startTime, endTime, type (TIME_SLOT or FULL_DAY), reason

BusinessSettings
  └── One-to-One: Business
       └── Fields: paymentType, depositPercentage, bufferTime, etc.
```

## Authentication & Authorization

### JWT-based Authentication

**Authentication Flow:**
- Frontend sends credentials to backend `/api/auth/login`
- Backend validates and returns JWT token
- Frontend stores token and includes in API requests
- Backend middleware validates token on protected routes

**Role-Based Access Control:**
```typescript
// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: 'OWNER' | 'ADMIN' | 'STAFF'
    businessId?: string
  }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export function requireBusinessOwner(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!['OWNER', 'ADMIN', 'STAFF'].includes(req.user!.role)) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    next()
  })
}
```

**Frontend Protection:**
```typescript
// frontend/lib/auth.ts
// Client-side route protection using Next.js middleware
// Protected routes redirect to login if no valid token
```

## Database Queries Examples

**Get Available Time Slots:**
```typescript
// backend/src/services/availability.ts
export async function getAvailableSlots(
  businessId: string,
  date: Date,
  serviceDuration: number // Duration in minutes from selected service
): Promise<TimeSlot[]> {
  // Get business's working hours for the day
  const dayOfWeek = date.getDay()
  const workingHours = await prisma.workingHours.findUnique({
    where: {
      businessId_dayOfWeek: {
        businessId,
        dayOfWeek
      }
    }
  })

  if (!workingHours || workingHours.isClosed) {
    return []
  }

  // Get existing appointments for the day
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const appointments = await prisma.appointment.findMany({
    where: {
      businessId,
      startTime: {
        gte: startOfDay,
        lte: endOfDay
      },
      status: {
        in: ['UPCOMING']
      }
    }
  })

  // Get blocked slots for the day
  const blockedSlots = await prisma.blockedSlot.findMany({
    where: {
      businessId,
      OR: [
        { date: date },
        { type: 'FULL_DAY', date: date }
      ]
    }
  })

  // Generate available slots based on service duration
  const slots = generateTimeSlots(
    workingHours.startTime,
    workingHours.endTime,
    workingHours.lunchStart,
    workingHours.lunchEnd,
    appointments,
    blockedSlots,
    serviceDuration // Use service duration instead of default
  )

  return slots
}
```

**Check Appointment Availability:**
```typescript
export async function checkAvailability(
  businessId: string,
  startTime: Date,
  duration: number
): Promise<boolean> {
  const endTime = new Date(startTime.getTime() + duration * 60000)

  // Check for conflicting appointments
  const conflicting = await prisma.appointment.findFirst({
    where: {
      businessId,
      status: 'UPCOMING',
      OR: [
        {
          startTime: {
            gte: startTime,
            lt: endTime
          }
        },
        {
          endTime: {
            gt: startTime,
            lte: endTime
          }
        }
      ]
    }
  })

  if (conflicting) return false

  // Check for blocked slots
  const date = new Date(startTime)
  date.setHours(0, 0, 0, 0)
  
  const blocked = await prisma.blockedSlot.findFirst({
    where: {
      businessId,
      date: date,
      OR: [
        { type: 'FULL_DAY' },
        {
          type: 'TIME_SLOT',
          startTime: { lte: formatTime(startTime) },
          endTime: { gte: formatTime(endTime) }
        }
      ]
    }
  })

  return !blocked
}
```

## Scalability

### Multi-Tenant Architecture
- **Yes**: Each business has isolated booking page
- **Yes**: URL slug based on business name (`/business-slug`)
- **Yes**: Independent schedules per business
- **Yes**: Multi-industry support (barbershops, salons, massage, spa, etc.)
- **Yes**: Business category/rubro field for industry classification
- **Future**: Multi-provider support within same business
- **Future**: Shared resources (e.g., client database) across providers in same business

### Performance and Limits
- **No**: No appointment limits in MVP
- **Future**: Rate limiting for bookings
- **Yes**: Real-time availability updates
- **Future**: Caching for booking pages
- **Future**: CDN for static assets

### Internationalization
- **Yes**: English and Spanish support in MVP (with language switcher button)
- **Yes**: Global timezone (single timezone for all barbers, not per-barber)
- **Future**: Additional languages
- **Future**: Per-barber timezone configuration
- **Future**: Currency support (for payments)

## Folder and File Organization

**Important**: Git repository is at the root level (`Appointments/`). All development commands (`npm run dev`, etc.) are run from the root directory.

```
Appointments/                     # Project root (Git repository root)
├── .git/                         # Git configuration
├── .gitignore                    # Git ignore rules
├── package.json                  # Root package.json (manages both projects)
├── README.md                     # Root README
├── frontend/                     # Next.js Frontend (UI only)
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Auth route group
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── verify-email/
│   │   ├── (public)/             # Public routes
│   │   │   └── [business-slug]/
│   │   │       └── page.tsx      # Public booking page
│   │   ├── (dashboard)/          # Protected routes
│   │   │   ├── dashboard/
│   │   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx        # Protected layout
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/                # React components
│   │   ├── ui/                   # Reusable UI components
│   │   ├── booking/              # Booking-specific components
│   │   └── dashboard/            # Dashboard components
│   ├── lib/                      # Frontend utilities
│   │   ├── api.ts                # API client (axios)
│   │   ├── auth.ts               # Auth utilities (token management)
│   │   └── utils.ts              # General utilities
│   ├── types/                    # TypeScript type definitions
│   │   └── index.ts
│   ├── public/                   # Static assets
│   │   ├── images/
│   │   └── logos/
│   ├── .env.local                # Frontend environment variables
│   ├── .env.example
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                      # Express.js Backend (REST API)
│   ├── src/
│   │   ├── routes/               # API route definitions
│   │   │   ├── appointments.ts
│   │   │   ├── availability.ts
│   │   │   ├── businesses.ts
│   │   │   ├── auth.ts
│   │   │   └── webhooks.ts
│   │   ├── controllers/         # Request handlers
│   │   │   ├── appointments.controller.ts
│   │   │   ├── availability.controller.ts
│   │   │   └── businesses.controller.ts
│   │   ├── services/             # Business logic layer
│   │   │   ├── appointments.service.ts
│   │   │   ├── availability.service.ts
│   │   │   ├── whatsapp.service.ts
│   │   │   └── stripe.service.ts
│   │   ├── middleware/           # Express middleware
│   │   │   ├── auth.ts           # Authentication middleware
│   │   │   ├── validation.ts    # Request validation
│   │   │   └── errorHandler.ts   # Error handling
│   │   ├── lib/                  # Backend utilities
│   │   │   ├── prisma.ts         # Prisma client singleton
│   │   │   ├── whatsapp.ts       # WhatsApp integration
│   │   │   ├── stripe.ts         # Stripe integration
│   │   │   └── utils.ts          # General utilities
│   │   └── index.ts              # Express server entry point
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema
│   │   └── migrations/           # Migration files
│   ├── .env                       # Backend environment variables
│   ├── .env.example
│   ├── tsconfig.json
│   └── package.json
│
└── docs/                         # Project documentation
```

## Root Package.json Configuration

The root `package.json` manages both frontend and backend projects, allowing you to run commands from the root directory:

```json
{
  "name": "appointments",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "build": "npm run build:backend && npm run build:frontend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build",
    "install:all": "npm install && cd frontend && npm install && cd ../backend && npm install",
    "db:migrate": "cd backend && npm run db:migrate",
    "db:generate": "cd backend && npm run db:generate",
    "db:studio": "cd backend && npm run db:studio",
    "db:seed": "cd backend && npm run db:seed"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

**Key Points:**
- `npm run dev` from root starts both frontend and backend simultaneously
- Uses `concurrently` package to run multiple processes
- All database commands can be run from root
- Git repository is at root level, tracking both projects together

### Code Organization Principles

1. **Feature-Based Components**: Group components by feature, not by type
2. **Colocation**: Keep related files together
3. **Barrel Exports**: Use index.ts for clean imports
4. **Type Safety**: Define types in dedicated files
5. **Utility Functions**: Keep reusable logic in lib/
6. **Server vs Client**: Clearly separate server and client components

### Prisma Client Singleton

```typescript
// backend/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

### Frontend API Client

```typescript
// frontend/lib/api.ts
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

## Example API Endpoints

All endpoints are REST API endpoints served by the Express backend.

### GET /api/businesses/:slug
Get public business profile for booking page.

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "slug": "string",
  "description": "string",
  "logo": "string",
  "coverPhoto": "string",
  "primaryColor": "string"
}
```

### GET /api/availability
Get available time slots for a business on a specific date.

**Query Parameters:**
- `businessSlug`: string (required)
- `serviceId`: string (required)
- `date`: ISO date string (required)

**Response:**
```json
{
  "date": "2024-01-27",
  "slots": [
    {
      "time": "09:00",
      "available": true
    }
  ]
}
```

### GET /api/availability/week
Get week availability with indicators for a business.

**Query Parameters:**
- `businessSlug`: string (required)
- `serviceId`: string (required)
- `startDate`: ISO date string (required) - First day of week

### POST /api/appointments
Create a new appointment.

**Request Body:**
```json
{
  "businessSlug": "string",
  "serviceId": "string",
  "startTime": "2024-01-27T09:00:00Z",
  "clientName": "string",
  "clientPhone": "string"
}
```

### POST /api/payments/create-intent
Create a payment intent for the deposit.

**Request Body:**
```json
{
  "appointmentId": "string",
  "amount": 1000,
  "currency": "usd"
}
```

### POST /api/appointments/cancel
Cancel an appointment via cancellation token.

**Request Body:**
```json
{
  "token": "string"
}
```
