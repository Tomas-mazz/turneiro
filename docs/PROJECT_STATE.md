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

---

## 4) Pending / next work (priority)

### Next steps
1. **QA** on mobile/desktop: admin (appointments, employees, wizard, business edit save + working hours), public booking (per-employee slots, theme toggle, confirm step).
2. **UI polish** if needed: employee row actions spacing; theme toggle on extreme viewports.
3. **Docs:** Update screenshots/flows for public booking (service, date, confirm) in both themes.

---

## 5) Scope guardrails (keep)

- Do not re-open completed items from section 3.
- Do not implement out-of-scope features without explicit decision:
  - Premium/advanced automations
  - Post-MVP multi-employee assignment with per-employee Google Calendar
- MVP current calendar model: **all business appointments sync to owner calendar**.

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
- Seed data: `npm run db:seed`
- Admin login: `tmazzucco.dev@gmail.com` (password from seed/env)
- Owner login: `owner@demo.com` / `demo123`

---

## 8) Context snapshot for next chat

**Last session:** Per-employee slot availability (public booking), removed "Dueño" badge/amber from employees (public + admin), fixed blank page on reload (useParams), Guardar cambios feedback (spinner + Guardado + delay), validation fix (logo/cover null), owner email duplicate rejected on create, ClientFormStep redesigned to match service/date (theme, header, inputs).

**Next:** QA (admin + public booking), small UI polish, update docs/screenshots. No blocked decisions for current MVP.
