# PROJECT STATE

**Purpose of this file:**  
This is the **single source of truth** for the current state of the project. Use it to understand what is done, what is pending, and what not to touch. When starting a **new chat**, send this file first so the AI can continue from here without redoing work.

---

## 1. For the new chat: read these docs (in this order)

1. **PROJECT_STATE.md** (this file) – current state and next steps  
2. **AI_RULES_FOR_CURSOR.md** – language (code/comments/commits in English; UI in Spanish), security, validation  
3. **CODING_RULES.md** – error handling, validation (Zod), conventions  
4. **Tech_Stack.md** – stack, scripts, env vars, repo structure  
5. **ROLES_PERMISSIONS.md** – what the owner dashboard can do vs admin  
6. **FEATURES_MVP.md** – MVP scope, owner dashboard scope  
7. **FLOWS.md** – business owner dashboard flow  
8. **PENDING_OR_UNCERTAIN.md** – resolved decisions (Google Calendar, dashboard scope)  
9. **ARCHITECTURE.md** – folder structure, API routes (reference)

**Reference only (do not use to generate code):** PROJECT_VISION.md, IDEAS_FUTURE.md, DESIGN_UX.md, OPEN_QUESTIONS.md.

---

## 2. Project summary

- **What it is:** MVP of a multi-tenant appointment booking SaaS (businesses, services, appointments, public booking page, owner dashboard).  
- **Stack:** Next.js 14 (frontend, UI only), Express (backend), PostgreSQL + Prisma, JWT auth.  
- **Repo:** Single repo at root `Appointments/`; `frontend/` and `backend/`; run commands from root (e.g. `npm run dev`, `npm run db:seed`).  
- **Language:** Code, comments, commits, README in **English**. All user-facing text (UI, errors) in **Spanish**.

---

## 3. Done (do not redo)

- Base structure (frontend/, backend/, docs), git, package.json root + frontend + backend, dependencies, README.  
- Env: `.env.example` in frontend and backend; `.env` / `.env.local` not versioned.  
- Frontend: Next.js (App Router), Tailwind, ESLint, pages (layout, globals.css, auth, dashboard, public `[business-slug]`), lib (api, auth, utils), types.  
- Backend: Express, routes/controllers/services, middleware (auth, errorHandler, validation), lib (prisma, utils).  
- Prisma: full schema (Business, User, Service, Appointment, WorkingHours, BlockedSlot, BusinessSettings, Subscription); **Appointment** has `cancellationReason` (optional) for owner cancel, `googleEventId` for calendar sync.  
- DB: PostgreSQL local, migrations; **seed** creates demo business, user `owner@demo.com` / `demo123`, service, working hours, demo appointments.  
- APIs: `GET /api/businesses/:slug`, `GET /api/availability` and `/week`, `POST /api/appointments`, `POST /api/appointments/cancel` (client by token).  
- Auth: JWT, bcrypt, register/login (register only via API); `requireAuth`, `requireBusinessOwner`; frontend login, dashboard layout protected.  
- **Payment Backend (Stripe + Mercado Pago):**  
  - `POST /api/payments/create-intent` – create payment intent/preference with deposit or full amount based on BusinessSettings.  
  - `POST /api/payments/confirm` – verify and confirm payment.  
  - `POST /api/webhooks/stripe` – webhook for Stripe payment events (payment succeeded, failed, refunded).  
  - `POST /api/webhooks/mercadopago` – webhook for Mercado Pago IPN notifications.  
  - Automatic refunds on cancellation (client within free window, owner always full refund).  
  - Prisma schema updated with payment fields: `paymentProvider`, `paymentIntentId`, `paymentAmount`, `refundAmount`.  
- **Google Calendar Integration (OAuth + One-Way Sync):**  
  - `GET /api/google-calendar/auth` – initiate OAuth flow, returns auth URL.  
  - `GET /api/google-calendar/callback` – OAuth callback, saves refresh token and calendar ID to user.  
  - `POST /api/google-calendar/disconnect` – disconnect Google Calendar.  
  - `GET /api/google-calendar/status` – check connection status.  
  - `POST /api/google-calendar/sync-appointment` – manually sync appointment to calendar.  
  - **Automatic sync:** appointments created → event in Google Calendar; appointments cancelled → event deleted from Google Calendar.  
  - Prisma schema updated: User has `googleRefreshToken` and `googleCalendarId`; Appointment has `googleEventId`.  
  - **Current scope (MVP):** Each business owner connects their personal Google Calendar; all appointments sync to owner's calendar. Multi-employee calendar support planned for next phase (see section 10).  
- **Owner dashboard APIs:**  
  - `GET /api/services` – list services for owner's business (requireBusinessOwner).  
  - `PATCH /api/services/:id` – update **price** and/or **duration** only (requireBusinessOwner).  
  - `GET /api/appointments` – list appointments for owner's business (for sync/UI; requireBusinessOwner).  
  - `POST /api/appointments/:id/cancel` – owner cancel with body `{ "reason": "..." }` (requireBusinessOwner); sets `status: CANCELLED` and `cancellationReason`; processes refund if paid; deletes Google Calendar event.  
- **Owner dashboard (single page):**  
  - One page at `/dashboard`: header with "Configuración" (left) and "Ver Google Calendar" (right, opens https://calendar.google.com).  
  - Section "Servicios (precio y duración)": table with name, price input, duration input, "Guardar" per row; calls PATCH /api/services/:id.  
  - Section "Cancelar citas": list of **upcoming** appointments (from GET /api/appointments), each with "Cancelar cita" → modal with required reason → POST /api/appointments/:id/cancel.  
- No `/dashboard/appointments` page (removed); `/dashboard/settings` redirects to `/dashboard`.  
- **Frontend: Google Calendar OAuth (done):** Dashboard has "Conectar Google Calendar" button; calls GET /api/google-calendar/auth and redirects to auth URL; Google redirects to frontend /api/google-calendar/callback, which forwards to backend callback; backend exchanges code and redirects to /dashboard?google_calendar=connected (or error param). Dashboard shows connection status, "Ver Google Calendar" and "Desconectar" when connected, and success/error messages from query params.  
- **Frontend: Payment step in booking flow (done):**  
  - GET /businesses/:slug returns `settings.paymentRequired` (and paymentType, depositPercentage).  
  - After client form, if payment required: step "Pago" with "Pagar con tarjeta (Stripe)" and "Pagar con Mercado Pago".  
  - Stripe: POST /payments/create-intent (STRIPE) → Stripe Elements (PaymentElement) → confirm → POST /payments/confirm → done. Return from 3DS: `/booking/stripe-return?appointmentId=&paymentIntentId=`.  
  - Mercado Pago: POST /payments/create-intent (MERCADOPAGO) → redirect to initPoint → return to `/booking/success|failure|pending?appointmentId=`; success page calls confirm and shows "Cita confirmada".  
- Public page `[business-slug]`: full booking flow **with payment step** (hero, service, calendar, slots, client form, payment when required, confirmation). Stripe Elements and Mercado Pago redirect; return pages: `/booking/success`, `/booking/failure`, `/booking/pending`, `/booking/stripe-return`.  
- Page `/cancel` for client to cancel by token.  
- UI and API error messages in Spanish.

---

## 4. Immediate pending (next steps)

- **Cancel by ID/código (optional UX improvement)** – Instead of listing all upcoming appointments, allow "enter appointment ID or short code → show that reservation → cancel with reason" to keep the dashboard light when there are many appointments. Add short code (last 6-8 chars of id) to Google Calendar event description for easy reference.

---

## 5. Owner dashboard scope (MVP) – do not add more here

The owner dashboard allows **only**:

1. Edit **service prices** (per service).  
2. Edit **service duration** (per service, 15–120 min).  
3. **Link to view Google Calendar** (top right on dashboard).  
4. **Cancel appointments** (with mandatory reason).  
   - Owner can cancel appointments by entering appointment ID (including appointments of their employees).  
   - Can only cancel appointments within their own business (cannot cancel appointments from other businesses).

Everything else (create/delete services, service names, working hours, blocks, branding, payment/cancellation rules) is **admin** (see ROLES_PERMISSIONS.md). There is no list-of-appointments page at `/dashboard/appointments`; owner sees appointments in Google Calendar (and currently in the "Cancelar citas" section on the single dashboard page).

---

## 6. Blocked / out of scope (do not implement without clarification)

- **Out of scope for now:** Premium features, complex automations.  
- **Multi-employee (multi-barber, multi-manicurista, etc.)** is **not in current MVP** but planned for next phase (see section 10).  
- **Google Calendar** is **in** MVP (basic subscription), not Premium; currently owner-level only, will be extended to per-employee in next phase.

---

## 7. Key files to touch when continuing

- **Backend:** `backend/src/routes/services.ts`, `backend/src/controllers/services.controller.ts`, `backend/src/services/services.service.ts`; `backend/src/routes/appointments.ts`, `backend/src/controllers/appointments.controller.ts`, `backend/src/services/appointments.service.ts`; `backend/src/lib/schemas.ts`; `backend/prisma/schema.prisma`.  
- **Frontend:** `frontend/app/(dashboard)/dashboard/page.tsx` (single dashboard page); `frontend/app/(public)/[business-slug]/page.tsx` (booking page); `frontend/lib/api.ts`; `frontend/types/index.ts`.  
- **Docs:** Update PROJECT_STATE.md when completing pending items.

---

## 8. How to run (for you or the new chat)

- From repo root: `npm run dev` (frontend :3000, backend :3001).  
- Seed (demo user + business + services + appointments): `npm run db:seed` from root.  
- Login: `owner@demo.com` / `demo123`.  
- Dashboard: http://localhost:3000/dashboard .  
- Public booking: http://localhost:3000/barberia-demo .  
- Migrations: `backend/prisma/migrations/` is in `.gitignore`; apply with `cd backend && npx prisma migrate dev` when schema changes.  
- Commits: **English** only (see AI_RULES_FOR_CURSOR.md, CODING_RULES.md).

---

## 9. Last commits (context for new chat)

- **feat: payment backend - Stripe + Mercado Pago with webhooks and refunds**  
  - Backend: payment intent/preference creation, webhook handlers, automatic refunds on cancellation.  
  - Prisma: payment fields (provider, intentId, amount, refund); BusinessSettings with payment config.  
  - Docs: `backend/PAYMENT_SETUP.md` with full setup and testing instructions.  
  
- **feat: Google Calendar integration - OAuth + one-way sync**  
  - Backend: OAuth flow, automatic event creation/deletion on appointment create/cancel.  
  - Prisma: User fields (googleRefreshToken, googleCalendarId); Appointment field (googleEventId).  
  - Docs: `backend/GOOGLE_CALENDAR_SETUP.md` with OAuth setup and testing.  
  
- **Note:** Frontend payment step and Google Calendar OAuth UI are pending (backend ready).

---

## 10. Multi-Employee Google Calendar (Post-MVP Architecture)

**Note:** "Multi-employee" refers to businesses with multiple staff members (barbers, manicurists, masseuses, etc.) across all business categories (rubros), not just barbershops.

### Architecture Overview

When multi-employee support is implemented:

#### Employee Management
- **Admin creates employees** for a business via admin panel (not self-service in MVP).
- Each employee is a `User` with role `STAFF` linked to a `businessId`.
- Employee has own working hours, availability, and services they can provide.

#### Google Calendar Per Employee
- **Each employee connects their own personal Google Calendar** via OAuth.
- Database structure:
  ```
  User (role: STAFF, businessId: xyz)
  ├── googleRefreshToken (employee's OAuth token)
  ├── googleCalendarId (employee's calendar, usually "primary")
  └── Appointments assigned to this employee
  ```

#### Appointment Assignment
- `Appointment` model gets `assignedToUserId` field (references User with role STAFF).
- When client books, they select:
  1. Service
  2. Employee (if multiple available)
  3. Date & Time (from employee's availability)
- Appointment syncs to the **assigned employee's Google Calendar**, not owner's.

#### Owner Dashboard Cancellation
- Owner can cancel **any appointment** within their business by entering appointment ID.
- Cancellation flow:
  1. Owner enters appointment ID/short code.
  2. System verifies appointment belongs to owner's business.
  3. If yes: cancels appointment, processes refund, deletes event from **assigned employee's Google Calendar**.
  4. If no: shows error "Cita no encontrada o no pertenece a tu negocio".
- Owner **cannot** cancel appointments from other businesses (enforced by `requireBusinessOwner` middleware).

#### Employee Calendar Access
- Each employee can view their own Google Calendar to see their schedule.
- Frontend (employee dashboard - future) would show link to their Google Calendar.
- Employees **cannot** cancel appointments themselves in MVP (must ask owner for cancellation).

### Database Changes Required (Post-MVP)

```prisma
model User {
  // ... existing fields ...
  assignedAppointments Appointment[] @relation("EmployeeAppointments")
}

model Appointment {
  // ... existing fields ...
  assignedToUserId String?
  assignedTo User? @relation("EmployeeAppointments", fields: [assignedToUserId], references: [id])
  
  @@index([assignedToUserId])
}
```

### Implementation Steps (Post-MVP)

1. **Schema migration**: Add `assignedToUserId` to Appointment.
2. **Admin panel**: Add employee management (create STAFF users, assign to business).
3. **Employee OAuth**: Extend `/api/google-calendar/*` routes to work for STAFF role.
4. **Booking flow**: Add employee selection step after service selection.
5. **Availability**: Filter slots by employee working hours.
6. **Sync logic**: Update `syncToGoogleCalendar()` to use assigned employee's calendar instead of owner's.
7. **Owner cancel**: Verify `appointment.businessId === user.businessId` before allowing cancellation.

### Why Not In MVP

- Adds complexity to booking UX (employee selection).
- Requires employee onboarding and OAuth setup.
- Most single-person businesses don't need this initially.
- Can be added incrementally without breaking existing functionality.

---

## 11. Documentation Files

- `backend/PAYMENT_SETUP.md` – Complete payment setup (Stripe/Mercado Pago, webhooks, testing).
- `backend/GOOGLE_CALENDAR_SETUP.md` – Complete Google Calendar setup (OAuth, sync, testing).
- All docs in `docs/` – Project architecture, features, roles, flows, rules.
