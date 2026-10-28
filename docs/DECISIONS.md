# Durable decisions

Product and technical choices that should survive UI refactors. Update this file when the rule itself changes — not when a screen moves.

## Product rules

1. **Booking identity:** Client **full name** and **phone** are always required before completing a paid/unpaid booking flow. Not configurable per shop.
2. **Payment rule shapes (per business settings):** Prefer the configured modes in `BusinessSettings` (required / optional / percentage vs full). Rules are **per business**, not “one global rule per rubro.” Rubro only gates capabilities (subservices, branding, add-ons).
3. **Cancellation policy messaging:** Clients should see the applicable cancellation policy before paying/confirming. Exact UI placement can change; the requirement to inform them does not.
4. **Rubro / category:** Stored on the business; changes are rare and go through platform admin (or equivalent privileged flow). Capabilities follow category mapping in code.
5. **Timezone:** One global app timezone (`APP_TIMEZONE`). No per-business timezone in current product scope.
6. **Appointments are automatic:** No manual “approve booking” step for normal public bookings.
7. **Google Calendar model:** Prefer syncing to the **assigned employee’s** connected calendar when available; otherwise the **owner’s**. Track which user calendar was used so cancels delete the right event. Owner calendars may show staff bookings with distinct styling/metadata — implementation details can evolve; the ownership rule should not silently invert.
8. **STAFF scope:** Staff only manage **their** appointments (and related blocks/calendar). Owners manage the whole shop. Backend must enforce.
9. **Seller scope:** Sellers only touch businesses they created (`createdBySellerId` or equivalent).
10. **Marketing access:** Landing “Solicitar acceso” is sales-led (email contact), not open self-serve OWNER signup.
11. **Client picks the professional:** With more than one employee, the client must choose who does the job before picking a service; there is no "anyone" option and no random/automatic assignment (it would push bookings onto some barbers). Services shown are the ones that professional does (`EmployeeServiceRestriction`), and availability is that professional's only. With a single employee the step is skipped.
12. **Business public info is owner-editable:** Owners edit name, description, phone, address and social links (WhatsApp, Instagram, Facebook, Maps, Google reviews) from the dashboard; empty fields are hidden on the public page.
13. **No "next free slot" shortcut naming a professional:** The public page does not promote the earliest-free barber (e.g. a cover chip "Próximo turno libre con X"); like #11, it would steer bookings toward some barbers and cause friction in the shop.
14. **People are shown by their real name:** The owner's name is required when a business is created and is what clients see on the booking page; owner and staff names can never be an email address.

## Technical rules

1. **Backend is authoritative** for authz, availability, prices charged, refunds, and industry gates.
2. **Validate with Zod** at API boundaries; return structured validation errors the UI can map.
3. **Passwords:** bcrypt. **Sessions:** JWT bearer tokens (frontend stores token; treat XSS carefully).
4. **Public write endpoints** (login, create appointment, payment intent): rate-limit.
5. **Webhooks:** do not enable money webhooks in production without signature verification.
6. **Industry capabilities:** extend `industryCapabilities` mapping explicitly; avoid scattered `if (category === …)` copies.
7. **Media:** uploads go through controlled upload endpoints (Cloudinary), not arbitrary client URLs without validation.

## Legal / Google branding URLs

Production:

| Use | URL |
|-----|-----|
| Home | `https://turneiro.com` |
| Privacy | `https://turneiro.com/privacy` |
| Terms | `https://turneiro.com/terms` |

Authorised domain for Google Cloud OAuth branding: `turneiro.com`.

Contact used in legal/marketing contexts should stay consistent with the landing (`turneiro.info@gmail.com` unless deliberately changed in all places).

## Explicitly unstable (do not document as gospel)

- Exact dashboard IA, button labels, or booking step order
- Landing section order / visual design tokens (except brand contact/demo URLs above)
- Whether Mercado Pago webhook is enabled in a given environment
- Commercial price amounts on the landing (marketing; not billing engine)
- “MVP vs Premium” matrices from old docs — many features moved; check code
