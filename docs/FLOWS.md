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
Sends WhatsApp confirmation to client
  ↓
Sends notification to business owner
  ↓
Booking complete
```

## Cancellation Flow
```
Client receives cancellation link (via WhatsApp/Email)
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

## Business Owner Dashboard Flow
```
Business owner logs into dashboard (User model with email/password)
  ↓
Views upcoming appointments
  ↓
Can filter by date range
  ↓
Views appointment details (name, phone, time, service, price, payment status)
  ↓
Can manually block time slots (specific hours)
  ↓
Can manually block entire days
  ↓
Can configure working hours
  ↓
Can update branding and settings
  ↓
Can activate/deactivate services
  ↓
Receives notifications for new bookings
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

## WhatsApp Notification Flow
```
Appointment created
  ↓
System triggers WhatsApp message
  ↓
Message includes:
  - Appointment date and time
  - Barber name
  - Cancellation link
  - Contact information
  ↓
24 hours before appointment
  ↓
System sends reminder message
  ↓
2 hours before appointment (optional)
  ↓
System sends final reminder
```
