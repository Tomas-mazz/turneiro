# Main Features (MVP)

## Owner Dashboard (MVP) – Scope Only

**In the MVP, the owner dashboard allows ONLY:**

1. **Edit service prices** – Change the price of each product/service of their business.
2. **Edit service duration** – Change the duration (e.g. 15–120 min) of each product/service.
3. **Link to view Google Calendar** – Open/view Google Calendar where appointments are synced.
4. **Cancel appointments** – Cancel their own business’s appointments (mandatory reason as per rules). When the business has employees (multi-rubro / staff with their own turns), **each employee can cancel their own appointments** (their own turns) by ID/code; they cannot cancel other employees’ appointments.

**Everything else is done by Admin** (see ROLES_PERMISSIONS.md): create/edit/delete services, service names, working hours, blocks, branding, payment and cancellation rules. There is no /dashboard/appointments page; owner sees appointments in Google Calendar and can cancel from dashboard (or via client link).

---

## Public Booking Page (`/business-slug`)

### URL Structure
- Business page: `/business-slug` (slugified business name, e.g., `/barberia-juan`, `/salon-maria`)
- Generic format: `tuturnero.com/business-slug` or `app-domain.com/business-slug`
- Each business has unique slug for their booking page

### Design
Minimalist design with hero section as first view

### Layout Structure

1. **Hero Section (First Tab/View)**:
   - Full-screen or large hero image/background with business cover photo
   - Business logo and name prominently displayed (centered)
   - Business description (optional)
   - Large "RESERVAR TURNO" / "BOOK APPOINTMENT" button (primary call-to-action)
   - Smooth scroll to booking section on button click

2. **Multi-Employee Selection (if applicable - Post-MVP)**:
   - If business has multiple employees (barbers, manicurists, etc.), show selection step
   - Display all available employees with photos/names
   - Client selects employee before proceeding
   - **Note:** "Multi-employee" (not "multi-barber") applies to all business categories/rubros

3. **Service Selection**:
   - Display available services with prices (vertical list)
   - Services: Corte (Haircut), Corte + Barba (Haircut + Beard), Barba (Beard)
   - Each service shows: radio button, name, price (right side), duration (optional)
   - Client selects desired service by clicking on service item
   - **Service Cart Overlay**: When service is selected, a bottom overlay appears showing:
     - Selected service name and price
     - "Continuar [price]" / "Continue [price]" button with arrow
     - **Overlay CANNOT be closed/dismissed**
     - **Explanations**: Explanations for products/services appear below the overlay in small text (very small font size)
     - **Note**: If business owner wants to configure cart contents (add/remove products), they must contact admin to make changes
   - Clicking "Continuar" proceeds to calendar view

4. **Date Selection (Month Calendar View)**:
   - Month calendar view showing all days of the month
   - Navigation: Previous/next month arrows
   - Quick buttons: "Hoy" (Today), "Primera hora disponible" (First available time)
   - Each day shows: day number + abbreviated day name (e.g., "27 Mar")
   - Days with no available slots: Grayed out/disabled (sold out)
   - Available days: Clickable, white text on dark background
   - Selected day: Highlighted with white background and dark text
   - Past dates: Grayed out and disabled

5. **Employees and Time Slots Display (Post-MVP for Multi-Employee)**:
   - **Note**: Multi-employee support is NOT included in MVP. Admin can add multiple employees per business, but shop owner must contact admin to add new employees. This feature is planned for post-MVP.
   - **MVP:** Shows single employee/owner's available slots.
   - **Post-MVP:** After selecting a day, shows all employees (if multi-employee business) or single employee
   - Each employee displayed with:
     - Circular profile photo/avatar
     - Employee name next to photo
     - Available time slots as small rectangular buttons in a grid
     - Time format: "09:00", "09:30", "11:00", etc. (24-hour or 12-hour format)
   - If employee has no available slots: Shows message "No hay turnos disponibles" / "No available slots"
   - Time slot buttons: Clickable, show time only (e.g., "11:00")
   - Selected time slot: Highlighted with primary color
   - Grid layout: Multiple time slots per row (responsive)

6. **Client Information Form (Before Payment)**:
   - Client full name input (required)
   - Phone number input (required, supports both international +1234567890 and local formats)
   - **Only full name and phone number are collected** (no email or other fields)
   - **ALWAYS required before payment** - This is NOT configurable, shop owners cannot decide this
   - **Information Message**: Displayed below form fields:
     - "Estos datos son obligatorios para la reserva así obtienes la confirmación, recordatorios y el link para poder cancelar tu reserva."
     - "These details are required for the reservation so you receive confirmation, reminders, and the link to cancel your reservation."
   - **Cancellation Policy Warning**: ALWAYS appears between name/phone input fields and payment step, displayed as small text (small font size) - appears always
   - Submit button (primary color) - proceeds to payment step

7. **Payment Policy Warning (Before Payment Step)**:
   - ALWAYS appears between name/phone input fields and payment step
   - Displays cancellation policy message configured by admin
   - Example: "Se puede cancelar hasta 24 horas antes sin costo. Si cancelas después, se cobrará un 10% de la reserva total ($25.00)"
   - Message is dynamic based on business's configured rules
   - Displayed as small text (small font size)
   - Always displayed (not conditional) - appears always

8. **Payment Step**:
   - Shows deposit amount (percentage or full payment as configured by admin)
   - Displays: "Depósito requerido: $X.XX (Y% del total)" or "Pago completo: $X.XX"
   - **Payment Method Selection**:
     - Mercado Pago (primary option for Latin America)
     - Credit/Debit Card (via Stripe or Mercado Pago)
   - Secure payment processing
   - Booking cannot proceed without payment completion (if required)

### Features
- Display barber's name and branding
- Show available time slots dynamically based on selected day
- Allow clients to select date and time
- Collect client information: name, phone number
- Display barber's configured working hours
- Show booked slots as unavailable
- Mobile-responsive design
- **Color Customization**: Each barber has their own primary color applied to buttons, active states, and accents
- **Language**: Spanish only in MVP. Language switcher and English are POST_MVP.
- **Multi-Barber Support**: Salon owners can create a shared booking page showing all barbers (future feature)

## Editable Branding (Admin Only in MVP)
- **Barber Name**: Display name on booking page – configured by Admin
- **Logo Upload**: Profile picture or logo – configured by Admin
- **Main Color**: Primary brand color for UI theming – configured by Admin
- **Basic Texts**: Welcome message, confirmation template, page title/description – configured by Admin
- Owner dashboard does NOT include branding in MVP.

## Appointment Calendar (Month View)
- **Primary View**: Month calendar view (similar to pamp.dk design)
- **Functionality**:
  - Display format: Day number + abbreviated day name (e.g., "27 Mar", "28 Mié")
  - Shows full month view with navigation to previous/next month
  - Quick navigation buttons:
    - "Hoy" / "Today": Jump to current date
    - "Primera hora disponible" / "First available time": Jump to next available slot
  - Navigation arrows: Left/right to change months
  - Click on day to view barbers and their available time slots
  - Current date: Highlighted
  - Selected date: White background with dark text (inverted colors)
  - Days with no available slots: Grayed out and disabled (sold out appearance)
  - Past dates: Grayed out and disabled
- **Barbers and Time Slots Display**:
  - After selecting a day, displays all barbers (if multi-barber) or single barber
  - Each barber section shows:
    - Circular profile photo (left side)
    - Barber name (next to photo)
    - Grid of available time slot buttons below name
  - Time slot buttons:
    - Small rectangular buttons
    - Time format: "09:00", "11:30", "14:00" (or 12-hour format)
    - Grid layout: Multiple slots per row (responsive, typically 3-4 per row)
    - Clickable, selected state with primary color
  - If barber has no slots: Shows message "No hay turnos disponibles" / "No available slots" in gray box
  - Only shows available time slots (booked slots hidden)
  - Time slots respect selected service duration

## Day and Time Selection
- **Time Slot Display**: 
  - 15-minute or 30-minute intervals (configurable)
  - Display format: "9:00 AM - 9:30 AM"
  - Gray out unavailable slots
- **Date Selection**: 
  - Calendar picker
  - Only show dates within barber's availability window (e.g., 30 days ahead)

## Services and Pricing
- **Service creation and names**: Admin creates services and sets names (owner cannot in MVP).
- **Price and duration (owner in MVP)**: Owner dashboard allows only editing **price** and **duration** of each existing service (e.g. Corte: 30 min, Corte+Barba: 45 min).
- **Display**: Services shown with prices before date selection on public page.
- **Impact**: Service duration determines time slot blocking.

## Editable Duration (Per Service) – Owner Dashboard (MVP)
- **Service-Specific Duration**: Each service has its own duration; owner can change only this (and price) in MVP.
- **Configuration Options**: 15–120 minutes per service (owner edits from dashboard).
- Admin configures everything else (create/delete services, names, working hours, etc.).

## Configurable Working Hours per Day (Admin Only in MVP)
- **Day-by-Day Configuration**: Monday–Sunday, open/closed, times – configured by Admin
- **Lunch Break**: Optional break – configured by Admin
- Owner dashboard does NOT configure working hours in MVP.

## Automatic Blocking of Booked Slots
- **Real-time Availability**: Slots become unavailable immediately upon booking
- **Prevent Double Booking**: System validation prevents overlapping appointments
- **Visual Feedback**: Booked slots clearly marked on calendar
- **Buffer Time**: Optional buffer between appointments (e.g., 15 minutes)

## Manual Blocking (Time Slots and Days) – Admin Only in MVP
- **Block Time Slots**: Admin blocks specific time ranges for a client
- **Block Entire Days**: Admin blocks full days for a client
- **Block Types**: TIME_SLOT, FULL_DAY – managed by Admin
- Owner dashboard does NOT manage blocks in MVP.

## Cancellation via Link with 24-Hour Rule
- **Cancellation Link**: Unique link generated per appointment. In MVP the link is **shown on the booking confirmation screen**; sending via WhatsApp/email is not implemented (POST_MVP).
- **24-Hour Rule**: 
  - Appointments can only be cancelled if more than 24 hours before scheduled time
  - System calculates time difference automatically
  - Clear error message if cancellation attempted too late
- **Cancellation & Refund Policy (Configurable per Business)**:
  - **Free Cancellation Window**: Configurable by admin (e.g., 24h, 48h before appointment)
  - **Cancellation within Free Window**: 
    - Full refund of advance payment automatically processed
    - Slot becomes available for other bookings
    - Confirmation message sent to both business owner and client
  - **Cancellation after Free Window**:
    - Refund policy depends on admin configuration:
      - **Option 1**: No refund, advance payment retained
      - **Option 2**: Partial refund (percentage configured by admin)
      - **Option 3**: Full refund (if admin configured it)
    - Slot becomes available for other bookings
    - Client receives notification with refund status
  - **Cancellation Flow**:
    1. Client clicks cancellation link
    2. System checks time remaining vs. business's configured free cancellation window
    3. System applies refund policy based on timing and business rules
    4. Refund processed automatically via Stripe (if applicable)
    5. Confirmation message sent to both parties

## WhatsApp Confirmations and Reminders
- **Status: POST_MVP / not implemented.** The integration (Twilio WhatsApp Cloud API or WhatsApp Business API) is planned but not active. No messages are sent on booking or as reminders.
- **Immediate Confirmation** (when implemented): Sent upon booking
  - Appointment details (date, time, barber name)
  - Cancellation link
  - Barber contact information
- **Reminders**:
  - 24 hours before appointment
  - 2 hours before appointment (optional, configurable)
- **Message Templates**: Pre-approved WhatsApp templates (required by WhatsApp Business API)
- **Integration**: Twilio WhatsApp Cloud API or WhatsApp Business API (to be defined)
- **Template Approval**: All message templates must be pre-approved by WhatsApp before use

## Business Setup (Admin in MVP)
- **Client/Business creation**: Admin creates clients (business name, category/rubro, profile, photo, logo, working hours, services, payment options, credentials). Admin assigns unique booking page URL (`/business-slug`).
- **Owner**: Receives credentials (email/password) and can log into dashboard to edit only **service prices**, **service duration**, and access **link to Google Calendar**. Everything else (profile, working hours, blocks, branding, payment/cancellation rules) is configured by Admin.
- **User Model**: Separate User model for authentication (email, password, role) linked to Business.
