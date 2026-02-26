# Pending or Uncertain Content

## Estado de integraciones (MVP)

- **WhatsApp:** No implementado. Servicio stub; no se envían confirmaciones ni recordatorios. POST_MVP.
- **Mercado Pago:** Pago (create preference, redirect) implementado. Webhook IPN deshabilitado por defecto (501 hasta implementar verificación HMAC). No activar `MERCADOPAGO_WEBHOOK_ENABLED=true` sin HMAC.
- **Idioma:** Solo español en MVP. Switcher e inglés son POST_MVP.
- **Verify-email:** Página stub en frontend; sin endpoint en backend. POST_MVP.
- **API:** No existen `GET/PUT/DELETE /api/appointments/:id` ni `POST /api/webhooks/twilio`. Listado y acciones de citas van por `/api/appointments` (owner) y `/api/admin/appointments` (admin).

## Resolved Clarifications

### Payment System Configuration
- **RESOLVED**: Payment rules apply equally to all business categories (rubros)
- **Payment Behavior Options** (Only these 2 options):
  - **Option A**: Require payment of a percentage to make a reservation, with the option to pay the full amount if the customer chooses to
  - **Option B**: No payment required to make a reservation, while still offering the option of voluntary full payment

### Business Category/Rubro
- **RESOLVED**: Business category/rubro is permanent setting
- Admin can change it, but this is very rare (category changes almost never happen)
- Category change must always go through admin

### Timezone Configuration
- **RESOLVED**: Timezone configuration will not be implemented
- Deferred for later if the project grows
- Not part of MVP or current roadmap

### Cancellation Rule Enforcement
- **RESOLVED**: Cancellation rules are configured by admin when creating a new client with their rubro (business category) in `/admin` panel
- Admin loads cancellation rules as specified by shop owner when creating the client
- No maximums or minimums - all rules are set manually by admin based on shop owner's requirements

### Payment Processing
- **RESOLVED**: Payment rules are separated by client, not by rubro (business category)
- Each client has their own rubro, conditions, and products configured
- Admin configures payment rules when creating a new client with their specific rubro and conditions
- Configuration done in `/admin` panel

### Registration Before Payment
- **RESOLVED**: Full name and phone number are ALWAYS required before payment
- This is NOT configurable - shop owners cannot decide this
- Name and phone must always be collected before payment step

### Multi-Barber Support
- **RESOLVED**: Multi-barber is a current feature but NOT included in MVP
- Only admin can add multiple barbers (shop owner cannot do this)
- Admin (platform admin, not shop owner) can add multiple barbers within the same barbershop
- Each barber has individual calendar with independent schedules and availability
- Shop owner can view appointments of their employees

### Google Calendar Integration
- **RESOLVED**: MVP, basic subscription (not Premium)
- Owner views all appointments in Google Calendar; no list of appointments in the dashboard
- Dashboard has link to view Google Calendar; connect/sync configured via Admin or same dashboard (link only in MVP)

### Owner Dashboard (MVP) Scope
- **RESOLVED**: In MVP the owner dashboard allows ONLY: (1) change service prices, (2) change service duration per service, (3) link to view Google Calendar, (4) cancel appointments. Everything else is done by Admin (see ROLES_PERMISSIONS.md). No /dashboard/appointments page.

### Service Cart Overlay
- **RESOLVED**: Service cart overlay CANNOT be closed/dismissed
- Explanations for products/services appear below the overlay in small text (very small font size)
- If business owner wants to configure cart contents (add/remove products), they must contact admin to make changes

### Cancellation Policy Warning
- **RESOLVED**: Warning ALWAYS appears between name/phone input fields and payment step
- Displayed as small text (small font size)
- Message is dynamically generated from business's configured rules
- Always displayed (not conditional) - appears always
