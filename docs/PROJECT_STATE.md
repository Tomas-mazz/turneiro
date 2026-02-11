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

### New in this chat
- **Admin Appointments view (completed):**
  - Backend:
    - `GET /api/admin/appointments` (filters: business/date/status)
    - `POST /api/admin/appointments/:id/cancel` (reason required)
    - `PATCH /api/admin/appointments/:id/status` (`UPCOMING`/`COMPLETED`)
  - Frontend:
    - `/admin/appointments` page with compact filters + table + actions.
    - Added "Ver citas" navigation from `/admin`.
- **Admin Employees CRUD (completed):**
  - Backend:
    - `GET /api/admin/businesses/:id/employees`
    - `POST /api/admin/businesses/:id/employees`
    - `PATCH /api/admin/employees/:id`
    - `DELETE /api/admin/employees/:id`
  - Frontend:
    - Employee section in business edit page (`/admin/businesses/[id]`)
    - Employee step in setup wizard (`/admin/businesses/[id]/setup?step=5`) now creates/lists/removes employees
    - Upload photo + name, append to list immediately
- **UI consistency updates:**
  - `/admin` and `/admin/appointments` action buttons aligned to dashboard green/red style.
- **Stability fixes made:**
  - Removed nested form issue in employees section.
  - Removed `required` conflict in employee draft input so "Guardar cambios" is not blocked.
  - Hook dependency warning fixed by using `[id, business]` where relevant.
- **Admin business edit/create fixes (completed):**
  - Fixed invalid nested form behavior on `/admin/businesses/[id]` so "Guardar horarios" persists correctly.
  - Added save feedback state on buttons ("Guardando..." -> "Guardado") and aligned green/red action style with admin/dashboard.
  - Fixed missing `uploadAdminFile` import in setup step 5 (`/admin/businesses/[id]/setup?step=5`), restoring frontend type-check.
- **Public booking theme toggle (completed):**
  - Removed theme selection from admin create/edit business UI.
  - Public booking page now defaults to dark mode and allows live theme switching from service/date headers.
  - Added smooth theme transition (non-abrupt) for background and key surfaces.
  - Light mode visual polish:
    - Service/date sections with improved contrast and border consistency.
    - Calendar date cards + slot buttons aligned to the same outlined visual language.
    - Bottom cart panel restyled with stronger readability and responsive header alignment.

---

## 4) Pending / next work (priority)

### Immediate pending
- **No major MVP feature pending from previous priority list** (Appointments + Employees are done).

### Next recommended iteration (safe and useful)
1. QA pass on mobile/desktop:
   - Admin appointments + employees + wizard step 5
   - Business edit page save flows (general save + working hours save)
   - Public booking theme toggle (service/date) with dark/light transitions
2. Small UI polish if needed:
   - Employee row actions spacing/placement
   - Public booking toggle icon sizing/position in extreme viewport widths
3. Update docs screenshots/flows (especially public booking service/date in both themes).

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

What was just completed:
- Admin appointments centralized management (filters + cancel + status update).
- Admin employees CRUD end-to-end (backend + edit page + setup step 5).
- Admin button style alignment and employee section form/UX fixes.
- Business edit/save stability + setup import fix (`uploadAdminFile`).
- Public booking live theme toggle (default dark) with smooth dark/light transitions and light mode UI polish.

What remains next:
- QA + polish only (no blocked architecture decisions required for current MVP).
