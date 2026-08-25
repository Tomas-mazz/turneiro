# Non-goals / boundaries

Things we are **not** trying to solve right now (or not without an explicit product decision). Use this to push back on scope creep.

## Not product goals (unless reopened deliberately)

- Full analytics / revenue dashboards as a core free promise
- Usage-based platform pricing / transaction fee engine as the main monetization (subscription ideas may return later)
- Per-business timezones
- Multi-language UI (Spanish only for user-facing copy)
- SMS as a primary channel
- Shared “client CRM database” across shops as a platform feature
- Custom domains for shops (future idea only — see ROADMAP)
- Treating WhatsApp as working confirmation/reminder delivery (stub today)
- Treating Stripe as an active payment backend (absent from backend code)
- Treating `Subscription` Prisma model as live billing enforcement

## Not agent goals

- Do not rewrite large UI specs into `/docs`
- Do not keep sprint diaries or “Phase N refactor playbooks” in `/docs` (use the chat/PR instead)
- Do not “fix” incomplete stubs (verify-email, WhatsApp) unless the user asks
- Do not expand industry categories without updating `industryCapabilities` and agreeing on flags

## Soft boundaries (exists partially — don’t overbuild)

- End-client accounts / history: may exist in thin form; not a full CRM
- Plan Pro / multi-business / higher employee caps: marketing “próximamente”, not necessarily implemented
- Recurring (“turno fijo”) appointments: idea only unless implemented in schema + services
