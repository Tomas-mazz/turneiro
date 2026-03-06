# EPIC – Store routing (Model A) + login

## Context

This repo contains **only** the product for stores (frontend + backend), not the marketing site:
- Each store will live under its own **subdomain** of `turneros.com`, for example:
  - `vasco-barber.turneros.com`
  - `another-store.turneros.com`
- The corporate site of the company will live in a **separate repo** with domain:
  - `turneros.com`

Selected model: **Model A – everything per store**
- Public booking: `https://{storeSlug}.turneros.com/` (clients reserve appointments).
- Owner/staff dashboard: `https://{storeSlug}.turneros.com/dashboard`.
- Login: `https://{storeSlug}.turneros.com/login`.
- End client can book **without** logging in; login is optional and adds extra value.

Recommended branch name for this work:
- `feature/store-routing-and-login`

---

## Step 1 – Store routing architecture (Model A)

### 1.1 Routes and domain design

**Goal:** Make `/` in each store subdomain show the public store page (booking), while keeping admin/dashboard/login routes working as they are.

Decisions:
- Keep the main booking page at `/(public)/[business-slug]/page.tsx`.
- In production, use a wildcard DNS like `*.turneros.com` pointing to this frontend.
- Keep these as **global routes within the same subdomain**:
  - `/dashboard`, `/admin`, `/login`, `/booking/*`, `/cancel`, plus framework internals like `/_next/*`, `/api/*`.

Checklist:
- [X] Document clearly how `{storeSlug}` is derived:
  - From hostname `{storeSlug}.turneros.com` on the frontend.
  - From `Business.slug` on the backend.
- [ ] Document which routes are “per store” vs global/shared.

### 1.2 Middleware: host → store slug

**Goal:** When the user visits `/` on a store subdomain, internally render `/(public)/[business-slug]` for that store.

Implementation outline:
- Create `frontend/middleware.ts`.
- Read `request.nextUrl.hostname` (for example `vasco-barber.turneros.com`).
- Detect if the hostname represents a store subdomain:
  - Extract `{storeSlug}` from the part before `.turneros.com`.
  - Exclude any special hostnames if we ever add them (e.g. `turneros.com` marketing, or others).
- If the path is `/` and we are on a store subdomain:
  - Rewrite internally to `/(public)/[business-slug]` for that store (URL stays `/` for the user).
- Do **not** rewrite requests for:
  - `/dashboard`, `/admin`, `/login`, `/booking/*`, `/cancel`.
  - Framework/internal paths like `/_next/*`, `/api/*`, assets, etc.

Checklist:
- [X] Design and document the exact hostname → `{storeSlug}` extraction logic.
- [X] List the routes that must be excluded from rewrites.
- [X] Note how to simulate subdomains in development (e.g. `/etc/hosts` entries like `vasco-barber.localhost`) and how to use `NEXT_PUBLIC_DEV_DEFAULT_STORE_SLUG` for `localhost:3000/`.

### 1.3 Links that go “back to the store”

Current behaviour: several places build links like ``href={`/${businessSlug}`}`` to go back to the store:
- `app/(dashboard)/layout.tsx` (sidebar/footer links).
- `app/(dashboard)/dashboard/page.tsx` (links “ir a la página de la tienda”).
- `app/(public)/booking/pending/page.tsx`.
- `app/(public)/booking/failure/page.tsx`.
- `app/(public)/booking/success/success-client.tsx`.

In the new subdomain model:
- When we are on `https://{storeSlug}.turneros.com`, the natural “back to store” link is just `/` on the **same host**.

Decision:
- Introduce a simple rule/helper for “go back to store” links:
  - When running inside a store subdomain → use `href="/"`.
  - (Optional for the future) If we ever add a central panel domain, construct `https://{storeSlug}.turneros.com/` instead.

Checklist:
- [X] Enumerate all call sites that use `/${businessSlug}` for navigation.
- [X] Decide whether, for now, all of them should change to `/` assuming dashboard/login live in the same subdomain.
- [ ] Document how these links should behave if a central domain is added later.

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

Checklist:
- [ ] Define exactly what each role sees in the header/menu:
  - OWNER.
  - STAFF.
  - USER (cliente).
  - Guest (not logged in).
- [ ] Define target URLs for each menu option (dashboard, account, settings, etc.).
- [ ] Confirm that login and dashboard will live under the same store subdomain.

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
- [ ] Verify that the current login flow (`/(auth)/login`) works correctly when served under a store subdomain.
- [ ] Decide whether login will stay as a dedicated `/login` page or also be accessible via a modal inside the store header using the same API.
- [ ] Document how roles from `auth_user` are used in:
  - `/(dashboard)/layout.tsx`.
  - `/(admin)/layout.tsx`.
  - Future header/menu logic on the public store page.

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

