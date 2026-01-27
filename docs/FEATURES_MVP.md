# Main Features (MVP)

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

2. **Multi-Barber Selection (if applicable)**:
   - If salon has multiple barbers, show selection step
   - Display all available barbers with photos/names
   - Client selects barber before proceeding

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

5. **Barbers and Time Slots Display**:
   - **Note**: Multi-barber support is a current feature but NOT included in MVP. Admin can add multiple barbers per business, but shop owner must contact admin to add new barbers.
   - After selecting a day, shows all barbers (if multi-barber salon) or single barber
   - Each barber displayed with:
     - Circular profile photo/avatar
     - Barber name next to photo
     - Available time slots as small rectangular buttons in a grid
     - Time format: "09:00", "09:30", "11:00", etc. (24-hour or 12-hour format)
   - If barber has no available slots: Shows message "No hay turnos disponibles" / "No available slots"
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
- **Language Support**: English and Spanish with language switcher button
- **Multi-Barber Support**: Salon owners can create a shared booking page showing all barbers (future feature)

## Editable Branding
- **Barber Name**: Display name on booking page
- **Logo Upload**: Profile picture or logo
- **Main Color**: Primary brand color for UI theming
- **Basic Texts**: 
  - Welcome message
  - Booking confirmation message template
  - Page title and description

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
- **Configurable Services**: Each barber can configure their services
- **Default Services**:
  - Corte (Haircut)
  - Corte + Barba (Haircut + Beard)
  - Barba (Beard)
- **Service Configuration**:
  - Service name (editable)
  - Price (configurable per barber)
  - Duration (configurable per service, e.g., Corte: 30min, Corte+Barba: 45min, Barba: 20min)
- **Display**: Services shown with prices before date selection
- **Impact**: Selected service duration determines time slot blocking

## Editable Duration (Per Service)
- **Service-Specific Duration**: Each service has its own duration
- **Configuration Options**: 15, 20, 30, 45, 60, 90 minutes per service
- **Impact**: Automatically blocks subsequent slots based on selected service duration

## Configurable Working Hours per Day
- **Day-by-Day Configuration**: 
  - Monday: 9:00 AM - 6:00 PM
  - Tuesday: 9:00 AM - 6:00 PM
  - Wednesday: Closed
  - etc.
- **Lunch Break**: Optional break time configuration (e.g., 12:00 PM - 1:00 PM)
- **Different Hours per Day**: Support varying schedules

## Automatic Blocking of Booked Slots
- **Real-time Availability**: Slots become unavailable immediately upon booking
- **Prevent Double Booking**: System validation prevents overlapping appointments
- **Visual Feedback**: Booked slots clearly marked on calendar
- **Buffer Time**: Optional buffer between appointments (e.g., 15 minutes)

## Manual Blocking (Time Slots and Days)
- **Block Time Slots**: Business owner can manually block specific time ranges
  - Select date and time range (start time, end time)
  - Reason for blocking (optional)
  - Blocks only affect future appointments
- **Block Entire Days**: Business owner can block full days
  - Select date(s)
  - Reason for blocking (optional)
  - All time slots for that day become unavailable
- **Block Types**:
  - **TIME_SLOT**: Specific time range blocked (e.g., 2:00 PM - 4:00 PM)
  - **FULL_DAY**: Entire day blocked
- **Block Management**: 
  - View all active blocks in dashboard
  - Edit or remove blocks
  - Blocks only affect future dates (cannot block past dates)

## Cancellation via Link with 24-Hour Rule
- **Cancellation Link**: Unique link sent via WhatsApp and email
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
- **Immediate Confirmation**: Sent upon booking
  - Appointment details (date, time, barber name)
  - Cancellation link
  - Barber contact information
- **Reminders**:
  - 24 hours before appointment
  - 2 hours before appointment (optional, configurable)
- **Message Templates**: Pre-approved WhatsApp templates (required by WhatsApp Business API)
- **Integration**: Twilio WhatsApp Cloud API or WhatsApp Business API (to be defined)
- **Template Approval**: All message templates must be pre-approved by WhatsApp before use

## Manual Business Registration
- **Registration Flow**:
  1. Business owner signs up with email and password
  2. **Selects business category/rubro** (barbershop, beauty salon, massage, spa, etc.) - **permanent setting**
  3. **Category Change**: Admin can change category, but this is very rare (category changes almost never happen). Change must always go through admin.
  4. Completes profile setup (business name, phone, description)
  4. Uploads cover photo and logo
  5. Configures working hours and services
  6. Sets up branding (primary color, welcome texts)
  7. **Configures payment options** (free, percentage deposit, or full payment)
  8. Receives unique booking page URL (`/business-slug`)
- **Verification**: Email verification required
- **Profile Completion**: Must complete all required fields before accepting bookings
- **User Model**: Separate User model for authentication (email, password, role) linked to Business
