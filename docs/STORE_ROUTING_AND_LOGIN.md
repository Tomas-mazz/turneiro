# EPIC – Store routing (Model A) + login

## Context

This repo contains **only** the product for stores (frontend + backend), not the marketing site:
Each store lives under its own **subdomain** of `turneiro.com`, for example:
  - `vasco-barber.turneiro.com`
  - `another-store.turneiro.com`
- The corporate site of the company will live in a **separate repo** with domain:
  - `turneros.com`

Selected model: **Model A – everything per store**
- Public booking: `https://{storeSlug}.turneiro.com/` (clients reserve appointments).
- Owner/staff configuration panel: `https://{storeSlug}.turneiro.com/dashboard` (UI label: **Configuración**).
- Login: `https://{storeSlug}.turneiro.com/login`.
- End client can book **without** logging in; login is optional and adds extra value.

Recommended branch name for this work:
- `feature/store-routing-and-login`

---

## Step 1 – Store routing architecture (Model A) ✅ DONE

### Implemented (summary)

- **`frontend/middleware.ts`**: Reads hostname; on store subdomain (`*.localhost` or `*.turneiro.com`) or on plain `localhost` with `NEXT_PUBLIC_DEV_DEFAULT_STORE_SLUG` set, rewrites `/` to `/{storeSlug}` so the public booking page is the "home". Excluded paths: `/dashboard`, `/admin`, `/login`, `/register`, `/booking`, `/cancel`, `/api`, `/_next`, and public files.
- **Dev default store**: Env `NEXT_PUBLIC_DEV_DEFAULT_STORE_SLUG` (e.g. `vasco-barber`) makes `http://localhost:3000/` show that store without subdomain. Documented in `frontend/.env.example` and set in `frontend/.env.local` for local use.
- **"Back to store" links**: All former ``href={`/${businessSlug}`}`` updated to `href="/"` in dashboard layout, dashboard page, and booking pending/failure/success pages. On the same host, `/` is always the store.
- **Backend CORS**: `backend/src/index.ts` CORS allows `FRONTEND_URL`, `*.localhost` (dev), and `*.turneros.com` (prod) so login and API work from store subdomains.
- **Routes**: Per-store = only `/` (rewritten to `/[business-slug]`). Global on same host = `/dashboard`, `/admin`, `/login`, `/register`, `/booking/*`, `/cancel`, `/api/*`, `/_next/*`.

### 1.1 Routes and domain design

**Goal:** Make `/` in each store subdomain show the public store page (booking), while keeping admin/dashboard/login routes working as they are.

Decisions:
- Keep the main booking page at `/(public)/[business-slug]/page.tsx`.
- In production, use a wildcard DNS like `*.turneiro.com` pointing to this frontend.
- Keep these as **global routes within the same subdomain**:
  - `/dashboard`, `/admin`, `/login`, `/register`, `/booking/*`, `/cancel`, plus framework internals like `/_next/*`, `/api/*`.

Checklist:
- [X] Document clearly how `{storeSlug}` is derived:
  - From hostname `{storeSlug}.turneros.com` on the frontend (prod) or `{storeSlug}.localhost` (dev); from `NEXT_PUBLIC_DEV_DEFAULT_STORE_SLUG` when host is plain `localhost`.
  - From `Business.slug` on the backend.
- [X] Document which routes are "per store" vs global/shared. Per store = `/` (rewrite only). Global = all other app routes listed above.

### 1.2 Middleware: host → store slug

**Goal:** When the user visits `/` on a store subdomain (or localhost with default slug), internally render `/(public)/[business-slug]` for that store.

Implementation (done):
- `frontend/middleware.ts` reads `request.nextUrl.hostname` and `Host` header.
- Store slug from host: `*.localhost` → part before `.localhost`; `*.turneiro.com` → part before `.turneiro.com`. Plain `localhost`/`127.0.0.1` → use `NEXT_PUBLIC_DEV_DEFAULT_STORE_SLUG` if set.
- If path is `/` and we have a store slug, rewrite to `/{storeSlug}`. Excluded: `/dashboard`, `/admin`, `/login`, `/register`, `/booking`, `/cancel`, `/api`, `/_next`, and static/public files.

Checklist:
- [X] Design and document the exact hostname → `{storeSlug}` extraction logic. Done in middleware; dev uses `.localhost` or env default.
- [X] List the routes that must be excluded from rewrites. Done in middleware `excludedPrefixes`.
- [X] Simulate subdomains in development: add e.g. `127.0.0.1 vasco-barber.localhost` in `/etc/hosts`; or set `NEXT_PUBLIC_DEV_DEFAULT_STORE_SLUG=vasco-barber` for `localhost:3000/`.

### 1.3 Links that go “back to the store”

Current behaviour: several places build links like ``href={`/${businessSlug}`}`` to go back to the store:
- `app/(dashboard)/layout.tsx` (sidebar/footer links).
- `app/(dashboard)/dashboard/page.tsx` (links “ir a la página de la tienda”).
- `app/(public)/booking/pending/page.tsx`.
- `app/(public)/booking/failure/page.tsx`.
- `app/(public)/booking/success/success-client.tsx`.

In the new subdomain model:
- When we are on `https://{storeSlug}.turneiro.com`, the natural “back to store” link is just `/` on the **same host**.

Decision:
- Introduce a simple rule/helper for “go back to store” links:
  - When running inside a store subdomain → use `href="/"`.
- (Optional for the future) If we ever add a central panel domain, construct `https://{storeSlug}.turneiro.com/` instead.

Checklist:
- [X] Enumerate all call sites that use `/${businessSlug}` for navigation.
- [X] Decide whether, for now, all of them should change to `/` assuming dashboard/login live in the same subdomain.
- [X] If a central domain is added later: "back to store" could point to `https://{storeSlug}.turneros.com/` when not on a store host; current implementation assumes same host.

---

## Step 2 – Login and user experience in the store header

### 2.1 Roles and header UX

Roles:
- `ADMIN`, `OWNER`, `STAFF`, `USER` (end client).

Requirements for the **store public header**:
- Show a **Login** button next to the theme switcher (dark/light).
- After login, show **user name + role** (for example `Tomas (OWNER)`).
- Clicking the name opens a **modal or menu** with:
  - Links for owners/staff:
    - Dashboard (`/dashboard`).
    - Store configuration (route to define, e.g. `/dashboard/settings`).
  - Links for clients:
    - Account configuration (e.g. `/account` or `/mi-cuenta`).
  - Option to log out.
- Clients are **not required** to log in to book; login is an optional enhancement.

**Implemented (guest UX):**
- **Header buttons**: “Iniciar sesión”, “Registrarse”, and theme toggle appear on the store booking steps (service, date, form). **Style:** no border; gray background matching calendar/cart (dark: `bg-neutral-700/80`, light: `bg-neutral-100`); all three buttons same height (`h-10 sm:h-11`); focus ring uses `focus-visible` only (keyboard), not on mouse click. Implemented in `BookingHeader`, `BookingLayout`, and passed from `BusinessBookingPage` via `ServiceStep`, `DateStep`, `ClientFormStep`.
- **Mobile header**: Below `md` breakpoint, the two text buttons are replaced by a single **person icon** that opens a dropdown with “Iniciar sesión” and “Registrarse”; same handlers. Dropdown closes on option click, outside click, or Escape. From `md` up, the two text buttons are shown as above.
- **Login**: Opens a **mini-modal** (`LoginModal`) on the same page. Form: email, password, “Iniciar sesión”; separator “——— o ———”; button “Continuar con Google” (logo only). Link “¿No tienes cuenta? Regístrate aquí” closes the modal and navigates to `/register`. Login uses existing `POST /auth/login`; token and user stored in `localStorage` via `lib/auth.ts`.
- **Register**: Dedicated **page** at `/register` (not a modal). **Dark theme** to match the booking flow: background `hsl(0, 0%, 9%)`, card `bg-neutral-800` with `border-neutral-700`, inputs `bg-neutral-700/80`, primary button white on black. Middleware excludes `/register` from rewrite. Page derives `storeSlug` from hostname (e.g. `vasco-barber.localhost`, or `NEXT_PUBLIC_DEV_DEFAULT_STORE_SLUG` on plain localhost). Form: name, email, password; “Registrarse”; same separator and Google button (logo only). “¿Ya tienes cuenta? Inicia sesión” links to `/`. On success: `POST /auth/register` with `businessSlug`, then store token/user and redirect to `/`.
- **Backend**: `POST /auth/register` added. Accepts `name`, `email`, `password`, `businessSlug`. Creates `User` with `role: 'USER'` and `businessId` for that store; validates email uniqueness (“El email ya está registrado”). Returns `{ token, user }` like login. Prisma `User` has optional `name`. Rate limit: same as login (5/15 min).

Checklist:
- [X] Guest: show “Iniciar sesión” and “Registrarse” in header (gray bg, no border; mobile: person icon + dropdown). Done in `BookingHeader` + layout + steps + page state.
- [X] Login via mini-modal on store page using existing `/auth/login`. Done: `LoginModal`, wired in `BusinessBookingPage`.
- [X] Register on separate route `/register` with store-scoped `businessSlug`. Done: `(public)/register/page.tsx`, middleware, backend `registerService` + route.
- [X] When logged in, show **user name + role** in header and replace login/register buttons with a menu (Configuración, account, settings, logout) per role. Done: BookingHeader shows name + role; dropdown with Configuración (/dashboard), Ajustes de la tienda (/dashboard/settings) for OWNER/STAFF; Mi cuenta (/account) for USER; Panel admin (/admin) for ADMIN; Cerrar sesión.
- [X] Define exactly what each role sees in the header/menu (OWNER, STAFF, USER, Guest). OWNER/STAFF: Configuración, Ajustes de la tienda, Cerrar sesión. USER: Mi cuenta, Cerrar sesión. ADMIN: Panel admin, Cerrar sesión. Guest: Iniciar sesión, Registrarse.
- [X] Define target URLs for each menu option (dashboard, account, settings, etc.). /dashboard, /dashboard/settings, /account, /admin.
- [X] Confirm that login and dashboard live under the same store subdomain. Yes; `/login` and `/register` are global on same host.

### 2.2 Auth mechanics (token, storage, per-subdomain behaviour)

Current implementation:
- Uses `localStorage` keys (`auth_token`, `auth_user`) in `frontend/lib/auth.ts`.
- Session is isolated per subdomain, which matches the “per store” model.

Decisions:
- Keep **localStorage-based** auth for now, scoped to each store subdomain.
- Consider moving to HttpOnly cookies in the future if we need:
  - Better security.
  - Shared login across multiple hostnames.

Checklist:
- [X] Login available as mini-modal in store header using same `POST /auth/login` API. Dedicated `/login` page still exists for direct navigation.
- [X] Register available at `/register` page; uses `POST /auth/register` with `businessSlug` from host.
- [ ] **Pending:** Optionally validate in backend that login is for a user belonging to the current store (e.g. require `businessSlug` and check `user.businessId`), so cross-store login is rejected.
- [ ] Document how roles from `auth_user` are used in `/(dashboard)/layout.tsx`, `/(admin)/layout.tsx`, and future header/menu logic on the public store page.

### 2.3 Client account page

Goal: Provide a simple “your data” section for logged-in clients.

Initial scope:
- Route (to confirm): `/account` or `/mi-cuenta`.
- Basic fields:
  - Name.
  - Email.
  - Phone.
- No requirement to have existing appointments; the page should still work and just show/edit personal data.

Checklist:
- [ ] Decide the final route for the client account page.
- [ ] Define the minimal data model and fields for the first version.
- [ ] Document how this page should behave with and without existing appointments.

### 2.4 Remaining steps (post–MVP or follow-up)

- **Header when logged in**: Hide “Iniciar sesión” / “Registrarse”; show user name + role; dropdown/menu with Dashboard (owners/staff), Account (clients), Settings (owners/staff), Log out.
- **Open login from register**: From `/register`, “¿Ya tienes cuenta? Inicia sesión” goes to `/`; optionally support `/?login=1` (or similar) to auto-open the login modal.
- **Strict per-store login**: Backend login could accept `businessSlug` and return 403 or clear error if `user.businessId` does not match that store.
- **Social login (Google)**: Implemented. Login and register show “o” + Google logo button; backend `GET /auth/google` and `GET /auth/google/callback` handle OAuth.

---

## Rules for keeping this file up to date

1. **When starting a significant sub-step**, mark the relevant checklist item as:
   - `[EN PROGRESS]` appended to the line, or add a short note below it.
2. **When finishing a sub-step**, change the checklist item to:
   - `[X]` at the beginning of the line, and (if needed) add one short line describing the outcome.
3. **When architectural decisions change**, always update:
   - The “Context” section (domains, store model, high-level decisions).
   - Any route/domain lists affected by the change.
4. **Do not delete important historical decisions**:
   - If something is reverted, move the explanation to a small “Changed decisions” note inside the relevant section, with a date.
5. **Before merging the feature branch**:
   - Review this file and ensure:
     - Checklists match the real state of the implementation.
     - Final decisions are clearly documented for future work and for AI assistants.

