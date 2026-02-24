# PROJECT STATE

Single source of truth for next chats.

---

## 1) Docs to read first (important files in `/docs`)

Read in this order:

1. `docs/PROJECT_STATE.md` (this file)
2. `docs/AI_RULES_FOR_CURSOR.md`
3. `docs/CODING_RULES.md`
4. `docs/Tech_Stack.md`
5. `docs/ROLES_PERMISSIONS.md`
6. `docs/FEATURES_MVP.md`
7. `docs/FLOWS.md`
8. `docs/PENDING_OR_UNCERTAIN.md`
9. `docs/ARCHITECTURE.md`

Reference only (do not use for code decisions):  
`docs/PROJECT_VISION.md`, `docs/IDEAS_FUTURE.md`, `docs/DESIGN_UX.md`, `docs/OPEN_QUESTIONS.md`.

---

## 2) Current project summary

- MVP multi-tenant booking SaaS (`frontend` Next.js, `backend` Express + Prisma + Postgres).
- One login (`/login`) with role-based redirect:
  - `ADMIN` -> `/admin`
  - `OWNER` / `STAFF` -> `/dashboard`
- Language rules:
  - Code/comments/commits/docs: English
  - User-facing UI and API messages: Spanish

---

## 3) Completed (do not redo)

### Core platform
- Auth with JWT/bcrypt and role-based access.
- Full booking flow on public page with payments (Stripe + Mercado Pago), cancellation token, and Google Calendar owner sync.
- Owner dashboard scope (MVP): edit service price/duration, blocks, cancel by phone lookup, Google Calendar connect/disconnect.

### Admin panel (done)
- Businesses CRUD with branding (name/description/logo/cover/theme), contact data, owner credentials.
- Payment/cancellation rules per business.
- Working hours CRUD (7 days).
- Services CRUD.
- Blocked slots CRUD.
- Delete business (cascade).
- Create-business wizard (steps 1-5).

### Recently completed
- **Admin Appointments:** `GET/POST/PATCH` admin appointments, `/admin/appointments` with filters and actions; "Ver citas" from `/admin`.
- **Admin Employees CRUD:** Backend routes + employee section on `/admin/businesses/[id]` and setup wizard step 5 (photo, name, staff credentials optional).
- **Admin UI:** Button style alignment (green/red), save feedback on "Guardar cambios" (spinner, "Guardado" + checkmark, ~3.2s before redirect), nested form and upload import fixes.
- **Public booking – per-employee slots:** Slots fetched per employee when there are employees; each employee shows only their available times (backend already supported `employeeId`).
- **Public booking – UI:** Removed "Dueño" badge and golden border from employees (public + admin). Fixed blank page on reload (`useParams` in `[business-slug]/page.tsx`). Theme toggle (dark/light) on service and date steps; **Confirmar reserva** step (ClientFormStep) redesigned to match: same header, theme toggle, summary card, inputs and buttons (dark/light).
- **Backend:** `updateBusinessSchema` – `logo`, `coverPhoto`, `coverVideo` accept `null` (fixes validation error on save). Create business: reject owner email if already registered (admin/other business); no longer reassigns existing user.
- **Owner vs Staff dashboard:** Only OWNER can edit service price/duration (backend 403 for STAFF; frontend hides "Servicios" section for STAFF). STAFF dashboard shows only: Google Calendar, block days, cancel turn; copy "Tu panel" / "Conectá tu Google Calendar...".
- **Employee–User link:** `Employee.userId` links STAFF user to employee; set when admin creates employee with credentials. Helper `getEmployeeIdByUserIdService` for scoping.
- **Staff cancel/lookup scope:** STAFF can only see and cancel appointments assigned to them (`employeeId`); lookup by phone returns only their appointments; backend enforces with clear Spanish errors.
- **Per-employee Google Calendar:** Sync targets assigned employee's calendar when they have Google connected; otherwise owner. `Appointment.syncedToUserId` stores which user's calendar was used; delete uses it for correct calendar.
- **Delete employee:** When admin deletes an employee, the linked STAFF User is also deleted (transaction), so the email can be reused for a new employee.
- **Business create/edit validation UX:** Validation and API errors (slug, owner email) are shown inline on the relevant inputs; backend returns `field` for business-logic errors; frontend uses `details` (Zod) or `field` to display per-field errors and banner "Revisá los campos marcados." when applicable.

---

## 4) Pending / next work (priority)

1. **QA** – Admin: appointments, employees, wizard, business edit save, working hours. Public booking: per-employee slots, theme toggle, confirm step. Owner vs staff login and dashboard behaviour; per-employee calendar flow.
2. **UI polish** (if needed): employee row actions spacing; theme toggle on extreme viewports.
3. **Docs:** Update screenshots/flows for public booking (service, date, confirm) in both themes.

---

## 5) Scope guardrails (keep)

- Do not re-open completed items from section 3.
- Do not implement out-of-scope features without explicit decision:
  - Premium/advanced automations
- **Calendar model (current):** Appointments sync to the **assigned employee's Google Calendar** when that employee has a linked User with Google connected; otherwise to **owner's calendar**. Each employee can connect their own Google Calendar and see only their appointments.

---

## 6) Key files to continue quickly

### Backend
- `backend/src/routes/admin.ts`
- `backend/src/controllers/admin.controller.ts`
- `backend/src/services/appointments.service.ts`
- `backend/src/services/employees.service.ts`
- `backend/src/lib/schemas.ts`
- `backend/prisma/schema.prisma`
- `backend/prisma/seed.ts`

### Frontend
- `frontend/app/(admin)/admin/page.tsx`
- `frontend/app/(admin)/admin/appointments/page.tsx`
- `frontend/app/(admin)/admin/businesses/new/page.tsx`
- `frontend/app/(admin)/admin/businesses/[id]/page.tsx`
- `frontend/app/(admin)/admin/businesses/[id]/setup/page.tsx`
- `frontend/app/(public)/[business-slug]/page.tsx`
- `frontend/app/(public)/[business-slug]/components/ServiceStep.tsx`
- `frontend/app/(public)/[business-slug]/components/DateStep.tsx`
- `frontend/app/(public)/[business-slug]/components/ClientFormStep.tsx`
- `frontend/lib/api.ts`
- `frontend/types/index.ts`

---

## 7) Run / test

- From repo root: `npm run dev`
- Apply migrations (if not yet): `npm run db:migrate` (from root) or `cd backend && npx prisma migrate dev`
- Seed data: `npm run db:seed`
- Admin login: `tmazzucco.dev@gmail.com` (password from seed/env)
- Owner login: `owner@demo.com` / `demo123`
- Staff login: create an employee with email/password in Admin → Businesses → [business] → Empleados, then log in with that email.

### QA checklist (owner vs staff, per-employee calendar)
- [ ] **Owner:** Dashboard shows "Configuración", section "Servicios (precio y duración)", Google Calendar, Bloquear días, Cancelar turno. Can edit price/duration and save. Lookup by phone shows all business appointments; can cancel any.
- [ ] **Staff:** Dashboard shows "Tu panel", no "Servicios" section; Google Calendar, Bloquear días, Cancelar turno. Hint "Solo ves y podés cancelar los turnos asignados a vos." visible. Lookup by phone returns only appointments assigned to that employee. Can cancel only those; attempting to cancel another’s (e.g. via API) returns error.
- [ ] **Per-employee calendar:** Book a slot with an employee who has staff credentials and has connected Google Calendar; event appears on that staff’s calendar. Cancel → event removed from that calendar. Book without employee or employee without Google → event on owner’s calendar.

---

## 8) Context snapshot for next chat

**Last session:** Owner vs staff (price edit, dashboard copy, cancel/lookup scope); Employee.userId + per-employee Google Calendar; delete employee deletes User; business create/edit inline validation (fieldErrors + backend field). PROJECT_STATE and ROLES_PERMISSIONS updated.

**Next:** QA (see section 4). No blocked decisions.
