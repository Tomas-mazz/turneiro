# Project Hub (read this first)

This file is the **single, stable entry point** to quickly resume work after changing chats.

## What this repo is

A multi-tenant appointment booking platform:

- **Frontend**: Next.js (App Router) in `frontend/`
- **Backend**: Express + Prisma + Postgres in `backend/`
- **Core concept**: each `Business` has a public booking page (`/[:business-slug]`) and private dashboards (admin + owner/staff).

For the current implementation status and concrete “what is done / what is next”, see `docs/PROJECT_STATE.md`.

## Where to start (docs)

- `docs/PROJECT_STATE.md`: current status + next steps (most important)
- `docs/AI_RULES_FOR_CURSOR.md`: language rules + non-negotiables
- `docs/ROLES_PERMISSIONS.md`: scope boundaries per role
- `docs/FLOWS.md`: key user flows (public booking, admin, dashboard)
- `docs/ARCHITECTURE.md`: backend/frontend architecture notes
- `docs/PENDING_OR_UNCERTAIN.md` + `docs/RESOLVED_AMBIGUITIES.md`: clarify edge cases

## Current initiative: Industry (“rubro”) capabilities

### Goal

Make the platform **scalable across industries** by turning `Business.category` (today a string) into a **capabilities-driven switch** that controls:

- what can be configured
- which UI sections appear
- what the API allows

This avoids scattered `if (category === ...)` logic and keeps the system maintainable as more industries are added.

### Current situation (today)

- The rubro is stored as `Business.category` (string).
- The system already supports:
  - **Sub-services** (`Service` -> `SubService`)
  - **Public branding settings** (`BusinessSettings`: brand color, intensity, gradient, backgrounds, etc.)
- Today, the platform does not enforce “industry restrictions” across all features consistently.

### Proposed approach (recommended)

**Backend is the source of truth.** The UI should reflect it for UX, but the backend must enforce.

Introduce a capability model:

- `allowSubServices`
- `allowBrandingAdvanced` (brand color/gradient/background/font settings)
- `allowMultipleServicesSelection` (public booking: select multiple services)
- (future) more flags as needed

Implementation strategy:

1. **Stage A (fast)**: map `Business.category` -> `capabilities` in code (no DB migration).
2. **Stage B (scalable)**: store industries in DB (e.g. `Industry` table) and attach a JSON `capabilities` config.

### Initial rubros

- `barbershop` / “peluquería”
  - `allowSubServices = false`
  - `allowBrandingAdvanced = false` (keep it simple)
- `wellness` / “estética”
  - `allowSubServices = true`
  - `allowBrandingAdvanced = true`

## Progress log (append-only)

Add short entries here (date + 3–8 bullets). Keep it factual: what changed + where.

### 2026-04-23

- Decided to implement “industry capabilities” to separate what each rubro can do.
- Plan: enforce restrictions in backend and mirror in frontend dashboard for UX.
- Docs: cleaned duplicated/outdated docs and created this `docs/PROJECT.md` hub.

