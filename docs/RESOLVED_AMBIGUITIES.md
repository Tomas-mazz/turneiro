# Resolved Ambiguities (Code vs Documentation)

This document records clarifications where the codebase and documentation were aligned in Phase 2.

## Authentication and registration

- **No public registration.** The system does not expose a self-registration or sign-up endpoint. Users (OWNER, STAFF, ADMIN) are created only by the platform admin (owner when creating a business, staff when creating an employee with credentials).

## Cancellation link delivery

- The cancellation link is **generated** and **shown on the booking confirmation screen**. Sending the link via WhatsApp or email is **not implemented** in the MVP (POST_MVP).

## Integrations

- **WhatsApp:** Not implemented. Service exists as stub only; no messages are sent. POST_MVP.
- **Mercado Pago webhook:** Endpoint exists but returns 501 unless `MERCADOPAGO_WEBHOOK_ENABLED=true`. HMAC verification is not implemented; webhook is considered disabled until HMAC is in place.
- **Twilio:** No webhook route `/api/webhooks/twilio` exists. Only Stripe and Mercado Pago webhooks are defined.

## API

- Admin and dashboard routes live under `/api/admin/*` and `/api/businesses`, `/api/appointments`, etc. There are no `GET/PUT/DELETE /api/appointments/:id` endpoints; listing and cancellation use `GET /api/appointments`, `GET /api/appointments/lookup`, and `POST /api/appointments/:id/cancel` (owner) or admin equivalents.

## Language and UI

- MVP user-facing content is **Spanish only**. Language switcher and English are POST_MVP.
