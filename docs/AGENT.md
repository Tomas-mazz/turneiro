# Agent guide

Durable rules for Cursor (and any) agents working on Turneiro.

## Language

1. **English only** for: code, comments, commits, README/docs in `/docs`, schema/field names, env var names, API path segments, technical notes.
2. **Spanish** for all end-user facing copy: UI labels, buttons, toasts, validation/API error messages shown to humans, emails the customer reads, marketing landing.

Do not mix languages in the wrong layer.

## Source of truth

| Concern | Truth |
|---------|--------|
| Auth, roles, business scoping, bookings, payments, availability | **Backend** (`backend/src`) |
| Industry feature gates | `backend/src/lib/industryCapabilities.ts` |
| Data model | `backend/prisma/schema.prisma` |
| Tenant URL rewrite (subdomain ↔ slug) | `frontend` middleware (routing only) |
| UI presentation | `frontend/` |

**Never** enforce security or money rules only in the frontend. Role checks in the UI are UX; backend must reject unauthorized actions.

When docs and code disagree: **trust code**, then update docs if the rule is durable.

## Architecture habits

- Monorepo: `frontend/` (Next.js App Router UI) + `backend/` (Express REST + Prisma + Postgres).
- Prefer routes → controllers → services on the backend.
- Prefer feature colocation on the frontend (route group / feature folder).
- Validate inputs with Zod on the backend; return clear Spanish errors to clients.
- Do not invent endpoints, Stripe flows, WhatsApp sends, or subscription billing — check code first (many older docs were wrong).

## Security habits

- Never commit secrets (`.env`, tokens, private keys).
- Use Prisma (no raw SQL string concatenation).
- Verify webhooks before enabling them in production.
- Cancellation and booking tokens must stay unguessable.
- Rate-limit sensitive public endpoints (login, create appointment, payment intent).

## Time & money

- Store timestamps in UTC; display with `APP_TIMEZONE` (global, not per-business).
- Payment provider in product code today: **Mercado Pago** (not Stripe).
- WhatsApp: stub only — do not assume messages are sent.

## Docs hygiene

- Keep `/docs` small and **stable**. Prefer rules, invariants, and mental models.
- Do **not** add long “step-by-step UI” or “session progress” markdown that will rot.
- Do **not** duplicate the schema or every route — link agents to folders instead.
- If you change a durable decision (roles, payment rules shape, tenancy), update `DECISIONS.md` / `SYSTEM.md` in the same PR/change set.

## Commercial / contact (marketing)

- Access requests / support contact used on the landing: `turneiro.info@gmail.com`
- Public legal pages: `/privacy`, `/terms` (also used for Google OAuth branding)
- Live product demo store: `https://demo.turneiro.com`
- Landing lives at apex `turneiro.com` / local `/` (`frontend/app/page.tsx` + `frontend/components/landing/`)

Commercial plan numbers and packaging may change; treat landing copy as marketing, not as billing enforcement (subscription model exists in schema but is largely unused in services).
