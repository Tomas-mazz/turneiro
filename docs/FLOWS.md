# Flows & Relationships

## Client Booking Flow
```
Client visits /business-slug (e.g., /barberia-juan, /salon-maria)
  ↓
Views hero section with business branding (cover photo, logo, name, description)
  ↓
Clicks "RESERVAR TURNO" / "BOOK APPOINTMENT"
  ↓
Selects service - sees prices
  ↓
Views month calendar with navigation
  ↓
Uses quick buttons: "Hoy" (Today) or "Primera hora disponible" (First available)
  ↓
Clicks on available day (sold out days are grayed out and disabled)
  ↓
Views all service providers (if multi-provider) or single provider
  ↓
For each provider:
  - Sees circular profile photo and name
  - Sees grid of available time slot buttons
  - If no slots: Sees "No hay turnos disponibles" message
  ↓
Selects time slot from provider's available slots
  ↓
Enters full name and phone number (ALWAYS required before payment - NOT configurable)
  ↓
Views cancellation policy warning message (small text between form and payment)
  ↓
Processes payment (Mercado Pago or Credit/Debit Card)
  ↓
Confirms booking
  ↓
System validates availability
  ↓
Creates appointment record (with service, price, provider, payment status)
  ↓
Blocks time slot based on service duration
  ↓
Client sees confirmation screen with cancellation link (WhatsApp/email sending not implemented; POST_MVP)
  ↓
Booking complete
```

## Cancellation Flow
```
Client has cancellation link (in MVP: shown on booking confirmation page; WhatsApp/email sending is POST_MVP)
  ↓
Clicks cancellation link
  ↓
System checks time remaining until appointment
  ↓
If < 24 hours: Show error message, prevent cancellation
  ↓
If > 24 hours: Proceed with cancellation
  ↓
Remove appointment from database
  ↓
Free up time slot
  ↓
Send cancellation confirmation to client
  ↓
Notify barber of cancellation
```

## Business Owner Dashboard Flow (MVP)
```
Business owner logs into dashboard (User model with email/password)
  ↓
Can ONLY:
  - Edit price of each service (product)
  - Edit duration of each service (product)
  - Open link to view Google Calendar (where appointments are synced)
  - Cancel appointments (own business; mandatory reason as per rules)
  - When business has employees: each employee can cancel their own appointments (their turns) by ID/code
  ↓
Everything else (create/edit services, working hours, blocks, branding,
payment rules, cancellation rules, centralized list of turns) is done by Admin.
No /dashboard/appointments page; owner sees appointments in Google Calendar.
```

## Platform Admin Configuration Flow (Payment & Cancellation Rules)
```
Admin logs into /admin panel
  ↓
Selects a business/client
  ↓
Navigates to "Payment & Cancellation Rules" section
  ↓
Discusses rules with business owner
  ↓
Configures payment settings:
  - Payment required: Yes/No
  - Payment type: Percentage deposit / Full payment
  - If percentage: Set percentage (10%, 20%, 50%, etc.)
  ↓
Configures cancellation rules:
  - Free cancellation window: Hours before appointment (e.g., 24h, 48h)
  - Cancellation has cost: Yes/No
  - If yes: Late cancellation fee percentage
  - Refund policy: Select from options
  ↓
Saves configuration
  ↓
Rules apply to all future appointments for that business
  ↓
Warning message automatically generated for booking page
```

## WhatsApp Notification Flow (POST_MVP – not implemented)
```
Appointment created
  ↓
System would trigger WhatsApp message (not implemented)
  ↓
Message would include: appointment details, cancellation link, contact (when implemented)
  ↓
Reminders 24h and 2h before (optional) – not implemented
```
