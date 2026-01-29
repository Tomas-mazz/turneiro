# Coding Rules & Conventions

## Project Language Rules

**IMPORTANT** – Two separate rules:

1. **In English only**: Code comments, git commits, README, variable/function names, API docs, database schema and field names, env var names, configuration files.
2. **User-facing content: Spanish by default.** All text the end user sees (UI, messages, errors shown in the app) must be in Spanish. Optional later: i18n for English.

## Error Handling

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode
    }
  }

  console.error('Unexpected error:', error)
  return {
    error: 'Internal server error',
    statusCode: 500
  }
}
```

## Validation

```typescript
// lib/validation.ts
import { z } from 'zod'

// Phone number validation: accepts both international (+1234567890) and local formats
const phoneRegex = /^(\+?[1-9]\d{1,14}|\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})$/

export const appointmentSchema = z.object({
  barberSlug: z.string().min(1),
  serviceId: z.string().min(1), // Required service selection
  startTime: z.string().datetime(),
  clientName: z.string().min(1).max(100),
  clientPhone: z.string().regex(phoneRegex, {
    message: "Phone number must be in international (+1234567890) or local format"
  }),
})

export const serviceSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().positive(),
  duration: z.number().int().min(15).max(120), // 15-120 minutes
  isActive: z.boolean().default(true),
})

export const workingHoursSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  isClosed: z.boolean().default(false),
})
```

## Internationalization (i18n)

**Default UI language: Spanish.** All user-facing text in the app is in Spanish. Optional later: add i18n (e.g. next-intl) and language switcher for English; persist preference in localStorage.

### Translation Keys Structure (for future i18n)
```
en/
  common.json
  booking.json
  dashboard.json
  errors.json

es/
  common.json
  booking.json
  dashboard.json
  errors.json
```

### Key Translations

#### English
- "BOOK APPOINTMENT" → "RESERVAR TURNO" (Spanish)
- "Select Date" → "Seleccionar Fecha"
- "Select Time" → "Seleccionar Hora"
- "Your Name" → "Tu Nombre"
- "Phone Number" → "Número de Teléfono"
- "Confirm Booking" → "Confirmar Reserva"
- "Appointment Confirmed" → "Cita Confirmada"
- "Cancel Appointment" → "Cancelar Cita"
```

## Timezone Handling

**Note**: Timezone configuration will not be implemented. Deferred for later if the project grows. Not part of MVP or current roadmap.

```typescript
// lib/timezone.ts
// Timezone handling deferred - not implemented in MVP
// Will be added later if project grows
```

## Security Best Practices

1. **Environment Variables**: Never commit secrets to Git
2. **Input Validation**: Validate all user inputs with Zod
3. **SQL Injection**: Use Prisma parameterized queries (automatic)
4. **XSS Protection**: Sanitize user-generated content
5. **CSRF Protection**: NextAuth.js handles this automatically
6. **Rate Limiting**: Implement rate limiting on API routes
7. **HTTPS**: Always use HTTPS in production
8. **Password Hashing**: Use bcrypt for password hashing
9. **Token Security**: Use cryptographically secure tokens for cancellation links
10. **Webhook Verification**: Always verify webhook signatures

## Performance Optimization

1. **Database Indexing**: Add indexes on frequently queried fields
2. **Caching**: Use Next.js caching for static data
3. **Image Optimization**: Use Next.js Image component
4. **Code Splitting**: Leverage Next.js automatic code splitting
5. **Database Queries**: Use Prisma includes to avoid N+1 queries
6. **CDN**: Vercel provides automatic CDN for static assets
7. **Pagination**: Implement pagination for large data sets
8. **Lazy Loading**: Load components and data on demand

## Monitoring and Logging

1. **Error Tracking**: Integrate Sentry or similar service
2. **Analytics**: Use Vercel Analytics for performance metrics
3. **Logging**: Use structured logging (Winston or Pino)
4. **Uptime Monitoring**: Set up uptime monitoring (UptimeRobot, etc.)
5. **Database Monitoring**: Monitor database performance and connections
