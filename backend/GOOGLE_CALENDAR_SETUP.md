# Google Calendar Integration Setup

This document describes the Google Calendar integration for automatic appointment syncing.

## What Was Implemented

### 1. Prisma Schema Updates
- Added Google Calendar fields to `User` model:
  - `googleRefreshToken` - OAuth refresh token for API access
  - `googleCalendarId` - Calendar ID (usually "primary")
  
- Added to `Appointment` model:
  - `googleEventId` - Google Calendar Event ID for tracking synced events

### 2. Google Calendar Service
**File:** `src/services/google-calendar.service.ts`

Functions:
- `getAuthUrl()` - Generate OAuth authorization URL
- `getTokensFromCode()` - Exchange authorization code for tokens
- `createAuthenticatedClient()` - Create OAuth2 client with refresh token
- `createCalendarEvent()` - Create event in Google Calendar
- `updateCalendarEvent()` - Update existing event
- `deleteCalendarEvent()` - Delete event from calendar
- `getCalendarEvent()` - Get event details
- `listCalendars()` - List user's calendars

### 3. OAuth Controller & Routes
**Files:** 
- `src/controllers/google-calendar.controller.ts`
- `src/routes/google-calendar.ts`

**API Endpoints:**

- **GET /api/google-calendar/auth** (protected)
  - Initiate OAuth flow
  - Returns authorization URL for user to visit

- **GET /api/google-calendar/callback** (public)
  - OAuth callback endpoint
  - Receives code from Google and exchanges for tokens
  - Saves refresh token and calendar ID to user

- **POST /api/google-calendar/disconnect** (protected)
  - Disconnect Google Calendar
  - Removes tokens from user

- **GET /api/google-calendar/status** (protected)
  - Get connection status
  - Returns whether calendar is connected

- **POST /api/google-calendar/sync-appointment** (protected)
  - Manually sync specific appointment to calendar
  - Body: `{ appointmentId }`

### 4. Automatic Sync
**File:** `src/services/appointments.service.ts`

- ✅ **On appointment creation**: Automatically creates event in Google Calendar
- ✅ **On appointment cancellation**: Automatically deletes event from Google Calendar
- Events include:
  - Summary: `{serviceName} - {clientName}`
  - Description: Client details, phone, price, status
  - Location: Business name
  - Reminders: 24 hours and 2 hours before

## Setup Instructions

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google Calendar API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

### 2. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Application type: **Web application**
4. Configure:
   - **Name**: Appointments App
   - **Authorized redirect URIs**: 
     - Development: `http://localhost:3000/api/google-calendar/callback`
     - Production: `https://your-domain.com/api/google-calendar/callback`
5. Click "Create"
6. Copy **Client ID** and **Client Secret**

### 3. Environment Variables

Add to `backend/.env`:

```bash
# Google Calendar Integration
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/google-calendar/callback"
```

**Important:** Update `GOOGLE_REDIRECT_URI` for production!

### 4. Run Database Migration

```bash
cd backend
npx prisma migrate dev --name add_google_calendar_fields
```

## OAuth Flow (Owner Dashboard)

### Step 1: Owner Initiates Connection

Frontend calls:
```typescript
GET /api/google-calendar/auth
Authorization: Bearer {jwt_token}

Response:
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "message": "Visita esta URL para autorizar Google Calendar"
}
```

### Step 2: Owner Authorizes

- Frontend redirects owner to `authUrl`
- Owner logs into Google account
- Owner grants calendar permissions
- Google redirects back to callback URL

### Step 3: Backend Saves Tokens

```typescript
GET /api/google-calendar/callback?code={auth_code}&state={user_id}

Response:
{
  "success": true,
  "message": "Google Calendar conectado exitosamente",
  "calendarName": "Primary"
}
```

Backend automatically:
- Exchanges code for tokens
- Finds primary calendar
- Saves `refreshToken` and `calendarId` to user record

### Step 4: Automatic Sync Starts

All future appointments are automatically synced:
- ✅ New appointment → Event created in Google Calendar
- ✅ Cancellation → Event deleted from Google Calendar

## Testing the Integration

### 1. Check Connection Status

```bash
curl http://localhost:3001/api/google-calendar/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Connect Google Calendar

```bash
# Get auth URL
curl http://localhost:3001/api/google-calendar/auth \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Visit the returned authUrl in browser
# After authorization, tokens are saved automatically
```

### 3. Create Appointment and Verify

```bash
# Create appointment (will auto-sync to calendar)
curl -X POST http://localhost:3001/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "businessSlug": "barberia-demo",
    "serviceId": "service-id",
    "date": "2024-03-20",
    "slotTime": "10:00",
    "clientName": "Test Client",
    "clientPhone": "+1234567890"
  }'

# Check Google Calendar - event should appear!
```

### 4. Manual Sync (Optional)

```bash
curl -X POST http://localhost:3001/api/google-calendar/sync-appointment \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": "appointment-id"
  }'
```

## Frontend Integration (Owner Dashboard)

### 1. Add Connect Button

```typescript
// Check if connected
const { data } = await api.get('/google-calendar/status')

if (!data.connected) {
  // Show connect button
  const { data: authData } = await api.get('/google-calendar/auth')
  window.location.href = authData.authUrl
}
```

### 2. Handle OAuth Callback

In frontend, create route at `/api/google-calendar/callback` that:
1. Receives the callback from Google
2. Shows success message
3. Redirects to dashboard

Or use a simple redirect page:
```typescript
// app/api/google-calendar/callback/page.tsx
'use client'

export default function CallbackPage() {
  useEffect(() => {
    // Show success message
    alert('Google Calendar conectado exitosamente')
    // Redirect to dashboard
    window.location.href = '/dashboard'
  }, [])

  return <div>Conectando Google Calendar...</div>
}
```

### 3. View Calendar Link

Already implemented in dashboard header:
```tsx
<a 
  href="https://calendar.google.com" 
  target="_blank"
  rel="noopener noreferrer"
>
  Ver Google Calendar
</a>
```

## How Automatic Sync Works

### On Appointment Create:

1. Client books appointment on `/[business-slug]`
2. `createAppointmentService()` creates appointment in DB
3. Calls `syncToGoogleCalendar()` asynchronously (doesn't block response)
4. Finds business owner's Google Calendar credentials
5. Creates event in Google Calendar
6. Saves `googleEventId` to appointment record
7. ✅ Event appears in owner's calendar instantly

### On Appointment Cancel:

1. Client or owner cancels appointment
2. `cancelAppointmentService()` updates status to CANCELLED
3. Calls `deleteFromGoogleCalendar()` asynchronously
4. Finds event by `googleEventId`
5. Deletes event from Google Calendar
6. ✅ Event removed from owner's calendar

### Error Handling:

- Sync failures don't block appointment operations
- Errors logged to console for debugging
- Owner can manually sync later if needed via API

## Security Notes

1. **Refresh Tokens**: Stored securely in database, never exposed to client
2. **OAuth State**: Uses user ID to prevent CSRF attacks
3. **Scopes**: Only requests calendar read/write, not full account access
4. **Token Refresh**: googleapis handles automatic token refresh
5. **Prompt Consent**: Forces consent screen to ensure refresh token is granted

## Troubleshooting

### "No refresh token received"

**Solution**: Revoke app access and re-authorize:
1. Go to https://myaccount.google.com/permissions
2. Find your app and remove access
3. Re-authorize (will force consent and give refresh token)

### "Calendar not syncing"

**Check:**
1. Is Google Calendar connected? Call `/api/google-calendar/status`
2. Check backend logs for sync errors
3. Verify Google Calendar API is enabled in Cloud Console
4. Verify OAuth redirect URI matches exactly

### "401 Unauthorized from Google"

**Solution**: Refresh token may be expired or revoked. Owner needs to reconnect.

## Next Steps (Future Enhancements)

- [ ] Two-way sync (read events from Google Calendar)
- [ ] Sync updates to existing appointments
- [ ] Support for multiple calendars
- [ ] Calendar event colors based on appointment status
- [ ] Conflict detection with other calendar events

## API Summary

```
GET    /api/google-calendar/auth              → Get OAuth URL
GET    /api/google-calendar/callback           → OAuth callback (public)
POST   /api/google-calendar/disconnect         → Disconnect calendar
GET    /api/google-calendar/status             → Check connection status
POST   /api/google-calendar/sync-appointment   → Manual sync
```

All protected endpoints require `Authorization: Bearer {jwt_token}` header.
