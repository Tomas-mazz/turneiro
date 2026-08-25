# System mental model

High-level map of Turneiro. Details change; this structure should stay useful.

## What it is

Multi-tenant **appointment booking SaaS** for service businesses (today focused on barbershops and salons). Each business gets:

- A **public booking page** for end clients
- **Shop dashboards** for owner/staff
- Platform surfaces for **ADMIN** and **SELLER**

## Repo layout

```
Appointments/
├── frontend/     # Next.js App Router — UI + thin OAuth callback routes
├── backend/      # Express + Prisma + Postgres — REST API, all business rules
└── docs/         # Durable agent context (this folder)
```

Root `npm` scripts orchestrate install/dev/build/db. Local default: frontend `:3000`, backend `:3001`.

## Frontend route groups (concept)

| Area | Role | Idea |
|------|------|------|
| Marketing landing | Public | Apex site: product story, pricing, CTA |
| `(public)/[business-slug]` | End clients | Book / pay / see confirmation |
| `(auth)/login` | Staff & platform users | JWT login; role-based redirect |
| `(dashboard)/setting` (+ related) | OWNER / STAFF | Shop configuration & day-to-day tools |
| `(admin)/admin` | ADMIN | Create/manage businesses, sellers, cross-shop appointments |
| `(seller)/seller` | SELLER | Manage businesses they created |
| `privacy` / `terms` | Public | Legal |

Exact paths and screens change; use the route group meaning, not pixel layouts.

## Multi-tenancy

- Tenant key: `Business.slug` (unique).
- Production pattern: `{slug}.turneiro.com` (middleware rewrites to the public booking app). Apex `turneiro.com` is marketing, not a shop.
- Dev patterns: `{slug}.localhost:3000` and/or path `/{slug}` (see frontend middleware / env).
- Almost all shop data is scoped by `businessId`.
- OWNER/STAFF JWT carries `businessId`. ADMIN can “act as” a shop via acting-as slug header when needed.

## Roles (code: `backend/src/lib/roles.ts`)

| Role | Layer | Mental model |
|------|-------|----------------|
| **ADMIN** | Platform | Full control: businesses, services, hours, employees, appointments, sellers |
| **SELLER** | Platform sales | Create/edit **only** businesses they created |
| **OWNER** | One shop | Configure and run their business (services, hours, branding as allowed, blocks, appointments, MP/GC) |
| **STAFF** | One shop + linked `Employee` | Narrower: own agenda, own blocks/cancels, own Google Calendar; not full service catalog edits |
| **USER** | End client | Book / cancel via public flows (and client register where enabled for a store) |

**Important:** Older docs said owners could only edit price/duration. **That is outdated.** Prefer current routes/controllers and the setting dashboard over historical MVP tables.

Provisioning: platform/shop users are created by admin/seller/setup flows — not an open “become OWNER” signup. End-client (`USER`) registration may exist for store-scoped clients; do not conflate the two.

## Domain objects (names stay; fields evolve)

- **Business** — tenant + branding + category (`rubro`)
- **BusinessSettings** — payment/cancel rules, slot interval, public branding knobs, MP credentials
- **User** — auth identity + role; optional `businessId`; Google Calendar tokens when connected
- **Employee** — bookable person; optional link to STAFF `User`
- **Service / SubService / ServiceAddOn** — catalog (subservices & add-ons gated by industry)
- **WorkingHours** — weekly open/close (+ lunch)
- **BlockedSlot** — full day or time range; business-wide or per employee
- **Appointment** — booking + payment snapshot + cancel token + GC sync ids
- **Subscription** — schema exists; **do not assume billing enforcement** unless you find it in services

## Industry capabilities

`Business.category` maps (in code) to capabilities such as:

- `allowSubServices`
- `allowBrandingAdvanced`
- `allowServiceAddOns`

Source of truth: `backend/src/lib/industryCapabilities.ts`. Backend must enforce; UI should mirror for UX only.

Known categories in mapping today include `barbershop`, `wellness`, `salon` (see file for exact flags). New industries = extend the map deliberately (Stage A). DB-driven industries are a later stage.

## Availability mental model

Slots are derived, not stored:

`working hours − lunch − blocked slots − existing appointments`, respecting service duration, employee assignment, and `slotIntervalMinutes`.

Employee-aware: when employees exist, availability is computed per employee (and week views consider “any employee has a slot”).

## Integrations (reality check)

| Integration | Assume |
|-------------|--------|
| Mercado Pago | Real payment path (preferences / OAuth connect per business). Webhooks may be gated — read env + webhook code before enabling. |
| Stripe | **Not** a live backend path; ignore README mentions unless reintroduced in code. |
| Google Calendar | Real OAuth + sync for owner/staff calendars |
| Email (SMTP) | Real sending path for transactional mail / jobs |
| QStash | Async jobs when configured; sync fallback otherwise |
| Cloudinary | Media uploads |
| Twilio WhatsApp | **Stub** — not product behavior |

## Where to look in code (anchors)

Backend:

- `backend/src/app.ts` — mounted `/api/*` routers
- `backend/src/middleware/` — auth, business context, validation
- `backend/src/services/` — domain logic (appointments, availability, payments, …)
- `backend/prisma/schema.prisma`

Frontend:

- `frontend/lib/api.ts` — HTTP client surface
- `frontend/lib/auth.ts` — token/user storage helpers
- `frontend/middleware.ts` — host/slug rewriting
- Route groups under `frontend/app/`

## Conceptual flows (stable intent)

1. **Book:** client opens shop page → picks service (and add-ons if allowed) → date/time (± employee) → identity → payment rules → appointment created → confirmation (+ cancel token shown).
2. **Cancel (client):** token link → rules (free window / fees) → refund if applicable → free slot → remove GC event if synced.
3. **Cancel (shop):** owner/staff lookup → reason required → scoped by role → refund + GC cleanup.
4. **Provision shop:** ADMIN or SELLER creates business + owner → configure hours/services/employees/settings → share public URL/subdomain.
