# Docs hub (Turneiro)

Read these before changing product behavior. Prefer **code** over these files when they disagree; update docs when a durable rule changes.

## Read order (agents)

| Order | File | Purpose |
|------:|------|---------|
| 1 | [AGENT.md](./AGENT.md) | How to work in this repo (language, truth, safety) |
| 2 | [SYSTEM.md](./SYSTEM.md) | Mental model: stack, tenancy, roles, domain, integrations |
| 3 | [DECISIONS.md](./DECISIONS.md) | Stable product/tech rules that should not drift with UI |
| 4 | [NON_GOALS.md](./NON_GOALS.md) | What we intentionally do **not** build (or not yet) |
| 5 | [ROADMAP.md](./ROADMAP.md) | Optional future ideas only — not specs, not status |

## What these docs are **not**

- Not a changelog or “what we did last sprint”
- Not pixel/UI walkthroughs (those go stale when screens change)
- Not a full API catalog (read `backend/src/routes/` and controllers)
- Not a feature checklist of IMPLEMENTADO/PARCIAL (infer from code)

## Setup / ops docs outside `/docs`

Operational how-tos that belong next to the code:

- Root `README.md` — install, seed, run
- `backend/GOOGLE_CALENDAR_SETUP.md`
- `backend/PAYMENT_SETUP.md`
- `backend/VERCEL_DEPLOY.md` (and similar deploy notes)

## Brand

Product name in UI and marketing: **Turneiro**. Repo folder may still say `Appointments`.
