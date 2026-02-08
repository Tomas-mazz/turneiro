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
- **Admin = platform/project owner:** The admin is the owner of the whole project/platform. They use the admin panel to create new businesses (shops), assign credentials to each business owner, and manage all businesses, services, rules, and appointments. Business owners (owners of each shop) only access their own dashboard; they do not create other businesses.  
- **Stack:** Next.js 14 (frontend, UI only), Express (backend), PostgreSQL + Prisma, JWT auth.  
- **Repo:** Single repo at root `Appointments/`; `frontend/` and `backend/`; run commands from root (e.g. `npm run dev`, `npm run db:seed`).  
- **Language:** Code, comments, commits, README in **English**. All user-facing text (UI, errors) in **Spanish**.

---

## 3. Done (do not redo)

- Base structure (frontend/, backend/, docs), git, package.json root + frontend + backend, dependencies, README.  
- Env: `.env.example` in frontend and backend; `.env` / `.env.local` not versioned.  
- Frontend: Next.js (App Router), Tailwind, ESLint, pages (layout, globals.css, auth, dashboard, public `[business-slug]`), lib (api, auth, utils), types.  
- Backend: Express, routes/controllers/services, middleware (auth, errorHandler, validation), lib (prisma, utils).  
- Prisma: full schema (Business, User, Service, Appointment, WorkingHours, BlockedSlot, BusinessSettings, Subscription); **Appointment** has `cancellationReason` (optional) for owner cancel, `googleEventId` for calendar sync. **Business** has `address`; **Employee** model (name, photoUrl, businessId) for booking page display (admin creates; used in service step and will be used in calendar step).  
- DB: PostgreSQL local, migrations; **seed** creates demo business, user `owner@demo.com` / `demo123`, 3 services (Corte, Corte + Barba, Barba), 3 employees, phone/email/address, working hours, demo appointments.  
- APIs: `GET /api/businesses/:slug` (returns business with services, workingHours, settings, **address**, **employees**); `GET /api/availability` and `/week`, `POST /api/appointments`, `POST /api/appointments/cancel` (client by token).  
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
  - **GET /api/appointments/lookup?phone=...** – return upcoming appointments for that client phone in owner's business (requireBusinessOwner); phone matched by normalized digits.  
  - `POST /api/appointments/:id/cancel` – owner cancel with body `{ "reason": "..." }` (requireBusinessOwner); sets `status: CANCELLED` and `cancellationReason`; processes refund if paid; deletes Google Calendar event.  
- **Owner dashboard (single page):**
  - One page at `/dashboard`: header with "Configuración" (left) and "Ver Google Calendar" (right, opens https://calendar.google.com).
  - Section "Servicios (precio y duración)": table with name, price input, duration input, "Guardar" per row; calls PATCH /api/services/:id.
  - Section **"Bloquear días u horarios"**: owner can create FULL_DAY or TIME_SLOT blocks (date, optional reason); list next 60 days with "Eliminar". APIs: GET/POST/DELETE /api/blocked-slots (requireBusinessOwner). Public booking page respects blocks (day grayed out or slots hidden).
  - Section **"Cancelar turno"**: input "Ingresar teléfono del cliente" → **GET /api/appointments/lookup?phone=...** returns upcoming reservations for that phone (owner's business only); reservations shown grouped by date (d/M), compact card per reservation with "Cancelar reserva" → modal with required reason → POST /api/appointments/:id/cancel. Clearing the phone input hides the list. No full list of all appointments; only results of the search by phone.
- No `/dashboard/appointments` page (removed); `/dashboard/settings` redirects to `/dashboard`.
- **Frontend: Google Calendar OAuth (done):** Dashboard has "Conectar Google Calendar" button; calls GET /api/google-calendar/auth and redirects to auth URL; Google redirects to frontend /api/google-calendar/callback, which forwards to backend callback; backend exchanges code and redirects to /dashboard?google_calendar=connected (or error param). Dashboard shows connection status, "Ver Google Calendar" and "Desconectar" when connected, and success/error messages from query params.  
- **Frontend: Payment step in booking flow (done):**  
  - GET /businesses/:slug returns `settings.paymentRequired` (and paymentType, depositPercentage).  
  - After client form, if payment required: step "Pago" with "Pagar con tarjeta (Stripe)" and "Pagar con Mercado Pago".  
  - Stripe: POST /payments/create-intent (STRIPE) → Stripe Elements (PaymentElement) → confirm → POST /payments/confirm → done. Return from 3DS: `/booking/stripe-return?appointmentId=&paymentIntentId=`.  
  - Mercado Pago: POST /payments/create-intent (MERCADOPAGO) → redirect to initPoint → return to `/booking/success|failure|pending?appointmentId=`; success page calls confirm and shows "Cita confirmada".  
- Public page `[business-slug]`: full booking flow **with payment step** (hero, service, calendar, slots, client form, payment when required, confirmation). Stripe Elements and Mercado Pago redirect; return pages: `/booking/success`, `/booking/failure`, `/booking/pending`, `/booking/stripe-return`.  
- **Public page hero (done):** Full-viewport background with business image/video (coverPhoto/coverVideo from API); default fallback videos for mobile and desktop in `frontend/public/videos`. Business name with typewriter effect (type → delete → repeat). Title centered between top and "Reservar" button; button centered in viewport. Background fixed to viewport so scroll/overscroll does not show white.
- **Public page refactor (done):** Route `[business-slug]` split into `types.ts`, `utils.ts`, `hooks/useTypewriter.ts`, and `components/` (BookingHero, ServiceStep, DateStep, TimeStep, ClientFormStep, PaymentStep, BookingDone, StripePaymentForm + index); page.tsx holds state and composition only.
- **Service step (done):** Dark background hsl(0,0%,9%); header with business name typewriter; title "Servicios" between header and list (centered on mobile); left column services list (price with space "$ 500", more spacing between items); right column sticky on desktop only (Empleados, Contacto, Horarios Lunes–Domingo "Cerrado" or time range). Body/html same dark background on service step to avoid white on overscroll.
- **Cart modal (done):** On service select, bottom sheet opens from below (no overlay); bg rgb(41,41,41); side and bottom margins, max-w-xl; "Continuar" button 50% width centered; close with X; slide-up (open) and slide-down (close) 0.15s, unmount on animationEnd.
- **Date step / calendar (done):** 7-day window from today with prev/next week navigation; content max-w-3xl centered; selected day in white; blocked or unavailable days with strikethrough and clickable (show "Sin turnos disponibles"); previous week button disabled when on current week; clicking a time slot goes directly to form step; past slots for today filtered in frontend using Argentina time; responsive tablet/mobile (3 date columns on mobile without scroll, slot grid 3 cols mobile / 4 desktop).
- **Service step – tablet and aside:** Tablet layout; aside (Empleados, Contacto, Horarios) with fixed gap between sections; employees grid max 3 columns per row.
- **Booking page default timezone:** Argentina (frontend `utils.ts`: BOOKING_TIMEZONE, getNowInArgentina(); page and DateStep use Argentina for todayKey and currentTimeStr when filtering past slots for today).
- **GET /api/availability/week:** Single 7-day window from startDate; hasSlots = slots.length > 0 for each day (no "today" time filter in backend); calendar shows day tachado only when closed or no slots at all.
- **Fonts:** Roboto (body) and Montserrat (headings) via next/font in layout and globals; Tailwind font-sans (Roboto), font-heading (Montserrat); h1–h6 use Montserrat in globals.
- Page `/cancel` for client to cancel by token.  
- UI and API error messages in Spanish.  
- **Error handling and UX:** Backend returns generic message for 5xx (no internal details to client); frontend shows user-friendly messages for server/technical errors (reservation, payment). Phone input in booking form restricted to digits and `+` only.
- **Admin panel – login, redirect, list businesses (done):**  
  - Single login at `/login` for owners and admin; backend returns JWT with `user.role` (OWNER, ADMIN, STAFF).  
  - Role-based redirect after login: ADMIN → `/admin`; OWNER/STAFF → `/dashboard`.  
  - Frontend stores user (id, email, role, businessId) in localStorage on login for layout checks; `removeAuthToken` clears token and user.  
  - Admin account in seed: `tmazzucco.dev@gmail.com` with role ADMIN (password in seed only).  
  - `/admin` route group with layout: protected; requires auth and role ADMIN, else redirect to /login or /dashboard.  
  - Dashboard layout: if user is ADMIN, redirect to `/admin`.  
  - Admin page at `/admin`: list of all businesses (GET /api/admin/businesses, requireAdmin); table with name, slug, category, contact, services count, appointments count; links "Ver reservas" (public page) and "Editar" → `/admin/businesses/[id]`; link "Crear negocio" → `/admin/businesses/new`.  
  - Booking flow: browser back and in-app "Volver" sync with history so back goes to previous step; ClientFormStep and PaymentStep have "Volver" buttons.
- **Admin – businesses CRUD (done):**  
  - **List and navigation:** `/admin` shows all businesses; "Crear negocio" goes to `/admin/businesses/new`; "Editar" goes to `/admin/businesses/[id]`.  
  - **Create business:** Form with name, slug, category, contact (phone, email), address; **branding:** logo and cover via **file upload** (not URL): backend `POST /api/admin/upload`, multer, files saved under `backend/uploads/`, served at `/uploads`. Logo = image; cover = image or video.  
  - **Theme (replaces primary color picker):** Business has `theme` in schema: **DARK** (fondo oscuro) or **LIGHT** (fondo blanco). Admin form has selector "Tema oscuro" / "Tema claro". Backend sets `primaryColor` from theme (botón claro/oscuro). No color picker.  
  - **Payment option:** When creating/editing business, admin chooses "Pago antes de la reserva" (sí/no). Stored in BusinessSettings (`paymentRequired`).  
  - **Owner credentials:** When creating business, admin can set owner email and password (optional). When editing, can update owner email/password. Backend creates or updates User with role OWNER and links to business.  
  - **Edit business:** Same fields as create (name, slug, category, contact, address, logo, cover, theme, pago antes de reserva, owner credentials).  
  - **Backend:** GET/POST/PATCH under `/api/admin/businesses` (requireAdmin); schemas Zod; services in `businesses.service.ts` (createBusinessForAdmin, updateBusinessForAdmin, getBusinessByIdForAdmin). Types/assertions in service for `theme` and `coverVideo` (Prisma client may need `npx prisma generate` to match schema).  
  - **Public page:** Uses `business.theme` for background and button styling; `isDarkTheme` derived from theme; ServiceStep and DateStep receive `isDarkTheme`. Hero uses coverPhoto/coverVideo from API.
- **Admin – payment and cancellation rules (done):**  
  - Section "Reglas de pago y cancelación" in admin business edit form (`/admin/businesses/[id]`).  
  - When "con pago antes de la reserva": type of payment (deposit % or full), deposit percentage if PERCENTAGE.  
  - Cancellation rules: free cancellation window (hours before), late cancellation has cost (checkbox), late cancellation fee (%).  
  - Buffer time between appointments (minutes).  
  - Backend: GET `/api/admin/businesses/:id` returns all settings; PATCH accepts and persists `paymentType`, `depositPercentage`, `freeCancellationWindow`, `cancellationHasCost`, `lateCancellationFee`, `bufferTime`.
- **Admin – create business wizard (done):**  
  - Step 1: Create business at `/admin/businesses/new` (datos del negocio). On success, redirect to `/admin/businesses/[id]/setup`.  
  - Step 2: Reglas de pago y cancelación.  
  - Step 3: Servicios (CRUD – add, edit, delete).  
  - Step 4: Horarios (placeholder – "Configurar después").  
  - Step 5: Empleados (placeholder – "Configurar después").  
  - Progress stepper; "Guardar y configurar después" on each step → redirect to edit page.
- **Admin – Services CRUD (done):**  
  - GET `/api/admin/businesses/:id/services` – list services for business.  
  - POST `/api/admin/businesses/:id/services` – create service (name, price, duration, isActive).  
  - PATCH `/api/admin/services/:id` – update service (name, price, duration, isActive).  
  - DELETE `/api/admin/services/:id` – delete service.  
  - Admin edit page: section "Servicios" with add form, table (edit inline, delete). Setup step 3: same add form, list, delete.

---

## 4. Pending (to do – in order)

All per ROLES_PERMISSIONS.md and FEATURES_MVP.md. Do not invent; only what is listed here.

1. **Working hours (per business)**  
   - Configure WorkingHours per day (Mon–Sun): open/closed, start time, end time, optional lunch break.  
   - One record per day per business.

2. **Blocks (per business)**  
   - Create, edit, delete BlockedSlot for any business: full day (FULL_DAY) or time slot (TIME_SLOT with start/end). Optional reason.  
   - Owner already has blocks in dashboard for their own business; admin must be able to manage blocks for any business.

3. **Branding (per business)**  
   - Edit: display name, logo, cover photo, theme (DARK/LIGHT), description/texts (as defined in product). Logo/cover already editable in business edit; ensure any extra branding fields are exposed in admin.

4. **Appointments (admin view)**  
   - View all appointments across all businesses (filters: business, date, status).  
   - Cancel any appointment (with mandatory reason). Change appointment status. Consult cancellation history.

5. **Employees (per business)**  
   - Create, edit, delete Employee for a business: name, photo. Used on the public booking page.  
   - Admin creates them; owner cannot add/remove employees in MVP.

---

## 5. Auth: single login, role-based redirect

- **Login:** One login page at `/login` for both **business owners** (MVP dashboard) and **platform admin** (admin panel). Same API: `POST /api/auth/login`; response includes `user.role` (OWNER | ADMIN | STAFF).
- **Redirect after login:**  
  - **ADMIN** → `/admin` (admin panel).  
  - **OWNER** or **STAFF** → `/dashboard` (owner dashboard).
- **Admin account:** Email `tmazzucco.dev@gmail.com`; password configured in seed or environment (never committed). Seed must create or update this user with `role: 'ADMIN'`.

---

## 6. Owner dashboard scope (MVP) – do not add more here

The owner dashboard allows **only**:

1. Edit **service prices** (per service).  
2. Edit **service duration** (per service, 15–120 min).  
3. **Link to view Google Calendar** (top right on dashboard).  
4. **Cancel appointments** (with mandatory reason).  
   - Owner can cancel appointments by entering **client phone** in dashboard (lookup returns that client's upcoming reservations; owner picks one and cancels with reason). Owner can also cancel any appointment in their business (including employees').  
   - Can only cancel appointments within their own business (cannot cancel appointments from other businesses).  
   - **Each employee** (when the business has staff / multi-rubro) **can cancel their own appointments** (their own turns); they cannot cancel other employees' appointments.

Everything else (create/delete services, service names, working hours, blocks, branding, payment/cancellation rules) is **admin** (see ROLES_PERMISSIONS.md). There is no list-of-appointments page at `/dashboard/appointments`; owner sees appointments in Google Calendar and in the "Cancelar turno" section (search by client phone). Owner **can** create/delete blocked days or time slots from the dashboard (see Done – Bloquear días u horarios).

---

## 7. Blocked / out of scope (do not implement without clarification)

- **Out of scope for now:** Premium features, complex automations.  
- **Multi-employee (multi-barber, multi-manicurista, etc.)** is **not in current MVP** but planned for next phase (see section 10).  
- **Google Calendar** is **in** MVP (basic subscription), not Premium; currently owner-level only, will be extended to per-employee in next phase.

---

## 8. Key files when continuing

- **Backend:** `backend/src/routes/admin.ts`, `backend/src/routes/upload.ts`, `backend/src/controllers/admin.controller.ts`; `backend/src/routes/businesses.ts`, `backend/src/services/businesses.service.ts`; `backend/src/routes/services.ts`, `backend/src/controllers/services.controller.ts`; `backend/src/routes/appointments.ts`, `backend/src/controllers/appointments.controller.ts`; `backend/src/routes/blockedSlots.ts`; `backend/src/middleware/auth.ts` (requireAdmin); `backend/src/lib/schemas.ts`; `backend/prisma/schema.prisma`; `backend/prisma/seed.ts`.  
- **Frontend:** `frontend/app/(admin)/layout.tsx`, `frontend/app/(admin)/admin/page.tsx`, `frontend/app/(admin)/admin/businesses/new/page.tsx`, `frontend/app/(admin)/admin/businesses/[id]/page.tsx`; `frontend/app/(auth)/login/page.tsx`; `frontend/app/(dashboard)/dashboard/page.tsx`; `frontend/app/(public)/[business-slug]/page.tsx` and components; `frontend/lib/api.ts`, `frontend/lib/auth.ts`; `frontend/types/index.ts`.  
- **Docs:** Update PROJECT_STATE.md when completing pending items.
- **Setup page:** `frontend/app/(admin)/admin/businesses/[id]/setup/page.tsx` – steps 2–5 after create.

---

## 9. How to run

- From repo root: `npm run dev` (frontend :3000, backend :3001).  
- Seed (demo user + business + services + appointments): `npm run db:seed` from root.  
- **Owner login:** `owner@demo.com` / `demo123` → redirects to `/dashboard`.  
- **Admin login:** `tmazzucco.dev@gmail.com` (password set in seed; see seed or env) → redirects to `/admin`.  
- Dashboard: http://localhost:3000/dashboard .  
- Admin panel: http://localhost:3000/admin .  
- Public booking: http://localhost:3000/barberia-demo .  
- Migrations: `backend/prisma/migrations/` is in `.gitignore`; apply with `cd backend && npx prisma migrate dev` when schema changes.  
- Commits: **English** only (see AI_RULES_FOR_CURSOR.md, CODING_RULES.md).

---

## 10. Multi-Employee Google Calendar (Post-MVP – do not implement in MVP)

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

#### Employee Calendar Access and Cancellation
- Each employee can view their own Google Calendar to see their schedule.
- Frontend (employee dashboard - future) would show link to their Google Calendar.
- **Each employee can cancel their own appointments** (their own turns) by entering appointment ID/code, with mandatory reason; they cannot cancel other employees' appointments. Owner can still cancel any appointment in the business.

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

## 11. Documentation files

- `backend/PAYMENT_SETUP.md` – Payment setup (Stripe/Mercado Pago, webhooks).
- `backend/GOOGLE_CALENDAR_SETUP.md` – Google Calendar setup (OAuth, sync).
- All docs in `docs/` – Architecture, features, roles, flows, rules.

---

## 12. Recent session (for next chat context)

**Done in last session:** Create-business wizard (steps 1–5), admin Services CRUD, and bugfixes.

- **Wizard:** Create at `/admin/businesses/new` → redirect to `/admin/businesses/[id]/setup`. Step 2 = payment/cancellation rules (PATCH). Step 3 = services (add/list/delete). Steps 4–5 = placeholders (“Configurar después”).
- **Admin Services:** GET/POST `/api/admin/businesses/:id/services`, PATCH/DELETE `/api/admin/services/:id`. Edit page has “Servicios” section (add form, table with inline edit, delete). Setup step 3 reuses same UI.
- **Fixes applied:** (1) `bcrypt` in `businesses.service.ts`: use static `import bcrypt from 'bcryptjs'` (dynamic import caused “bcrypt.hash is not a function”). (2) `updateBusinessSchema`: `depositPercentage`, `freeCancellationWindow`, `lateCancellationFee`, `bufferTime` are `.optional().nullable()` so PATCH from setup step 2 accepts `null`. (3) `optionalUrl` in schemas: accepts full URL or path starting with `/`. (4) Upload route: fallback `host`/`protocol` to avoid bad URL. (5) In development, 500 responses return real error message; `createBusiness` and `getBusinessServices` log errors to console.
- **Next pending (in order):** 1) Working hours (admin CRUD). 2) Blocks (admin for any business). 3) Branding. 4) Appointments admin view. 5) Employees (admin CRUD).
