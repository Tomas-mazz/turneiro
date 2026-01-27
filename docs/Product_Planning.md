# Product Planning – Multi-Industry Appointment Booking SaaS

## Project Language Rules

**IMPORTANT**: All project content must be in English:
- Code comments
- Git commits and commit messages
- README files and documentation
- Variable names and function names
- User-facing text (with i18n support for English/Spanish in the UI)
- API documentation
- Error messages and logs
- Database schema and field names

The user interface will support English and Spanish through internationalization (i18n), but all code, documentation, and technical content must be in English.

---

## Executive Summary

### What the SaaS is
A multi-tenant, multi-industry appointment booking SaaS platform. The platform enables businesses (barbershops, beauty salons, massage therapy, spa services, nail salons, etc.) to manage their appointment schedules, accept bookings from clients, and automate confirmations and reminders via WhatsApp. The same interface is reused for all businesses; only the data changes based on each business's configuration.

### Problem it solves
- **For Service Businesses**: Manual appointment management leads to double bookings, missed clients, and administrative overhead
- **For End Clients**: Difficulty booking appointments, lack of reminders, and uncertainty about availability
- **For Business Owners**: No centralized system to track appointments, manage schedules, and handle multiple service providers

### Target customers
- **Primary**: Independent service businesses (barbers, estheticians, massage therapists, etc.) operating single-provider operations
- **Secondary**: Small businesses (2-5 providers) with multiple service providers
- **Tertiary**: Medium-sized businesses requiring advanced features and analytics
- **Industries**: Barbershops, beauty salons, massage therapy, spa services, nail salons, and other appointment-based service businesses

### Value proposition
"Enable service businesses to focus on their craft while we handle appointment management, client communication, and scheduling optimization through an automated, WhatsApp-integrated booking system. One platform, multiple industries, unlimited scalability."

---

## Business Model

### Basic Plan (MVP)
- **Pricing**: Free (unlimited during initial launch / Beta)
- **Features Included**:
  - Single business profile (supports multiple industries/categories)
  - **Unlimited appointments** (no limits on booking volume)
  - WhatsApp confirmations and reminders
  - Basic branding customization (logo, cover photo, name, primary color, description, basic texts)
  - Business category/rubro selection (barbershop, beauty salon, massage, spa, etc.)
  - Public booking page with hero section
  - Appointment cancellation via link
  - 24-hour cancellation rule enforcement
  - Business owner can edit and cancel appointments from dashboard
  - **Block time slots and days** (manual blocking functionality)
  - **Mandatory 10% deposit**: All appointments require a 10% deposit at booking time
  - **Note**: Statistics, analytics, and client tracking are NOT included in free plan

### Premium / Paid Extras Plan
- **Pricing**: Monthly subscription (TBD, suggested $9.99-$19.99/month)
- **Monetization Model**: Monthly subscription-based SaaS
- **Features**:
  - Appointment and revenue statistics dashboard
  - **Frequent client tracking and ranking** (client history across appointments)
  - Client blocking/blacklist functionality
  - Advanced branding customization
  - Custom domain support
  - Enhanced message customization
  - **Google Calendar Integration** (view appointments in Google Calendar, sync one-way)
  - Priority support

### Multi-Barber Support (Future)
- **Pricing**: $29.99-$49.99/month per salon
- **Features**:
  - Multiple barber profiles per salon
  - Salon owner dashboard
  - Cross-barber scheduling
  - Salon-level analytics
  - Team management tools

### Payment Options for Appointments (MVP)
- **Configurable Payment Rules (Set by Admin per Business)**:
  - **Advance Payment**: Admin configures percentage (e.g., 10%, 20%, 50%) OR full payment option
  - **Payment Requirement**: Admin can set payment as required or optional per business
  - Rules are discussed with business owner and configured in `/admin` panel
- **Payment Processing**: 
  - **Mercado Pago Integration**: Primary payment processor (especially for Latin America)
  - **Credit/Debit Card**: Supported via Mercado Pago and Stripe
  - Both payment methods available in payment step
- **Cancellation & Refund Rules (Set by Admin per Client)**:
  - **Configuration**: Admin loads cancellation rules in `/admin` panel when creating a new client with their rubro (business category)
  - **Free Cancellation Window**: Admin sets minimum time before appointment for free cancellation (e.g., 24h, 48h)
  - **Cancellation Cost**: Admin configures if cancellation has a cost or is free
  - **Refund Policy**: Admin sets refund rules:
    - Full refund if cancelled within free window
    - Partial refund (percentage) if cancelled after free window
    - No refund if cancelled too close to appointment
  - Example: "Cancel 24h before = full refund, after 24h = no refund"
- **Payment Policy Warning**: ALWAYS appears between name/phone input fields and payment step, displayed as small text (small font size):
  - "Se puede cancelar hasta [X tiempo] antes sin costo. Si cancelas después, se cobrará un [Y%] de la reserva total ($[valor])"
  - Message is dynamically generated from business's configured rules
  - Always displayed (not conditional) - appears always

### Future Payments and Subscriptions
- **Retention Strategy**: Monthly/annual subscription tiers
- **Payment Processing**: Stripe integration for subscription billing
- **Revenue Model**: Subscription-based SaaS with optional transaction fees

---

## Roles & Permissions

### Client (End User)
**Can do:**
- View business's public booking page
- Book available appointment slots
- Cancel own appointments (with 24-hour rule)
- Receive WhatsApp confirmations and reminders
- Access cancellation link from confirmation

**Cannot do:**
- View other clients' appointments
- Access any dashboard
- Modify business settings or schedules

### Platform Admin (Central Admin Panel - for You)
**Can do:**
- **Manage Clients:**
  - Create new clients (Business Name, Industry, Photo, Colors, Working Hours)
  - Generate credentials (User/Pass) for the Client Panel
  - Edit any client's data
  - View all clients and their configured services
- **Manage Services:**
  - Create services for any client (Haircut, Esthetics, Massage, etc.)
  - Edit existing services: price, duration, activate/deactivate
  - Assign predefined services to clients based on their industry (rubro)
- **Configure Payment & Cancellation Rules (Per Client):**
  - **Payment Configuration:**
    - Payment rules apply equally to all business categories (rubros)
    - Payment rules are separated by client, not by rubro. Each client has their own rubro, conditions, and products configured.
    - Admin configures payment rules when creating a new client with their specific rubro and conditions
    - Set advance payment percentage (e.g., 10%, 20%, 50%) OR full payment option
    - Configure whether payment is required or optional
    - **Registration Before Payment**: Name and phone are ALWAYS required before payment - NOT configurable, shop owners cannot decide this
  - **Cancellation Rules:**
    - Admin loads cancellation rules in `/admin` panel when creating a new client with their rubro (business category)
    - Set minimum time before appointment to cancel without cost (e.g., 24 hours, 48 hours)
    - Configure if cancellation has a cost or is free
    - Set time window for free cancellation (e.g., "Cancel 24h before = free, after = no refund")
    - Configure refund policy (full refund, partial refund, no refund based on timing)
  - These rules are discussed with the business owner and configured in `/admin` panel when creating the client
- **Manage Appointments (Turns):**
  - Visualize all turns from all clients in a centralized view
  - Cancel any turn (Mandatory reason entry)
  - Change turn status (Confirmed / Cancelled)
  - Consult cancellation history and reasons
- **Manage Blocks:**
  - Create schedule/day blocks for any client
  - Edit or delete existing blocks
- **Security:**
  - All actions are validated to prevent errors in pricing, duration, and schedules.
  - No direct database access (all via panel).

### Business Owner (Client Panel - Limited Access)
**Can do:**
- **Manage Services:**
  - Change price and duration of their own services
  - Activate/deactivate their own services
- **Manage Appointments (Turns):**
  - View their own business calendar and turns
  - Cancel their own turns (Mandatory reason entry)
  - View appointments in Google Calendar (if connected)
  - Access dashboard via link from Google Calendar event or direct login
- **Manage Blocks:**
  - Block specific hours or full days for their own business
- **Visual Configuration:**
  - Change business photo/cover
  - Change business primary colors
- **Google Calendar Integration:**
  - Each shop owner with employees can add them, and each employee will have their own Google Calendar
  - Not limited to barbershops - applies to all shop owners who have employees and want to add them
  - Each employee has their own individual Google Calendar
  - Connect Google Calendar account (OAuth)
  - View all appointments synchronized to Google Calendar
  - Access dashboard for appointment management via event link
- **Communication:**
  - When cancelling a turn, the mandatory reason is automatically sent to the end client via WhatsApp.

**Cannot do:**
- Create or delete services (only activate/deactivate or edit price/duration)
- Change service names
- Access other businesses' data, turns, or schedules
- Affect schedules or blocks of other businesses

---

## Panel Comparison Summary

| Function | Admin Panel (You) | Client Panel (Owner) |
| :--- | :--- | :--- |
| Create Clients | ✅ | ❌ |
| Create Services | ✅ | ❌ |
| Edit Services | ✅ (Full) | ✅ (Price, Duration, Status only) |
| Configure Payment Rules | ✅ (Per business) | ❌ |
| Configure Cancellation Rules | ✅ (Per business) | ❌ |
| Cancel Turns | ✅ (With Reason + WhatsApp) | ✅ (Own business, with Reason + WhatsApp) |
| Block Hours/Days | ✅ (Full control) | ✅ (Own business only) |
| Visual Configuration | ✅ (Full control) | ✅ (Own business only) |
| Access Other Businesses | ✅ | ❌ |
| Direct DB Access | ❌ (Via Panel only) | ❌ (Via Panel only) |

---

## Main Features (MVP)

### Public Booking Page (`/business-slug`)
- **URL Structure**: 
  - Business page: `/business-slug` (slugified business name, e.g., `/barberia-juan`, `/salon-maria`)
  - Generic format: `tuturnero.com/business-slug` or `app-domain.com/business-slug`
  - Each business has unique slug for their booking page
- **Design**: Minimalist design with hero section as first view
- **Layout Structure**:
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
       - Explanations for products/services appear below the overlay in small text (very small font size)
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
     - **Information Message**: Displayed below form fields:
       - "Estos datos son obligatorios para la reserva así obtienes la confirmación, recordatorios y el link para poder cancelar tu reserva."
       - "These details are required for the reservation so you receive confirmation, reminders, and the link to cancel your reservation."
     - Submit button (primary color) - proceeds to payment step
     - **Note**: This step may be optional if business owner doesn't require registration before payment (configurable by admin)
  7. **Payment Policy Warning (Before Payment Step)**:
     - Displays cancellation policy message configured by admin
     - Example: "Se puede cancelar hasta 24 horas antes sin costo. Si cancelas después, se cobrará un 10% de la reserva total ($25.00)"
     - Message is dynamic based on business's configured rules
     - Shown prominently before payment step
  8. **Payment Step**:
     - Shows deposit amount (percentage or full payment as configured by admin)
     - Displays: "Depósito requerido: $X.XX (Y% del total)" or "Pago completo: $X.XX"
     - **Payment Method Selection**:
       - Mercado Pago (primary option for Latin America)
       - Credit/Debit Card (via Stripe or Mercado Pago)
     - Secure payment processing
     - Booking cannot proceed without payment completion (if required)
- **Features**:
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

### Editable Branding
- **Barber Name**: Display name on booking page
- **Logo Upload**: Profile picture or logo
- **Main Color**: Primary brand color for UI theming
- **Basic Texts**: 
  - Welcome message
  - Booking confirmation message template
  - Page title and description

### Appointment Calendar (Month View)
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

### Day and Time Selection
- **Time Slot Display**: 
  - 15-minute or 30-minute intervals (configurable)
  - Display format: "9:00 AM - 9:30 AM"
  - Gray out unavailable slots
- **Date Selection**: 
  - Calendar picker
  - Only show dates within barber's availability window (e.g., 30 days ahead)

### Services and Pricing
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

### Editable Duration (Per Service)
- **Service-Specific Duration**: Each service has its own duration
- **Configuration Options**: 15, 20, 30, 45, 60, 90 minutes per service
- **Impact**: Automatically blocks subsequent slots based on selected service duration

### Configurable Working Hours per Day
- **Day-by-Day Configuration**: 
  - Monday: 9:00 AM - 6:00 PM
  - Tuesday: 9:00 AM - 6:00 PM
  - Wednesday: Closed
  - etc.
- **Lunch Break**: Optional break time configuration (e.g., 12:00 PM - 1:00 PM)
- **Different Hours per Day**: Support varying schedules

### Automatic Blocking of Booked Slots
- **Real-time Availability**: Slots become unavailable immediately upon booking
- **Prevent Double Booking**: System validation prevents overlapping appointments
- **Visual Feedback**: Booked slots clearly marked on calendar
- **Buffer Time**: Optional buffer between appointments (e.g., 15 minutes)

### Manual Blocking (Time Slots and Days)
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

### Cancellation via Link with 24-Hour Rule
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

### WhatsApp Confirmations and Reminders
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

### Manual Business Registration
- **Registration Flow**:
  1. Business owner signs up with email and password
  2. **Selects business category/rubro** (barbershop, beauty salon, massage, spa, etc.) - cannot be changed after setup
  3. Completes profile setup (business name, phone, description)
  4. Uploads cover photo and logo
  5. Configures working hours and services
  6. Sets up branding (primary color, welcome texts)
  7. **Configures payment options** (free, percentage deposit, or full payment)
  8. Receives unique booking page URL (`/business-slug`)
- **Verification**: Email verification required
- **Profile Completion**: Must complete all required fields before accepting bookings
- **User Model**: Separate User model for authentication (email, password, role) linked to Business

---

## Paid Extras / Future Roadmap

### Appointment and Revenue Statistics
- **Dashboard Metrics**:
  - Total appointments (this week, month, year)
  - Revenue tracking (if deposits enabled)
  - Peak booking times
  - Cancellation rate
  - Average appointments per day/week
- **Charts and Graphs**: 
  - Appointment trends over time
  - Day-of-week booking patterns
  - Revenue charts
  - Client retention metrics

### Frequent Client Tracking and Ranking
- **Client Database**: Track all clients who have booked
- **Booking History**: View all appointments per client
- **Ranking System**: Identify top clients by appointment frequency
- **Client Notes**: Add private notes about clients
- **Contact Information**: Stored phone numbers for easy access

### Client Blocking
- **Block Specific Clients**: Prevent certain clients from booking
- **Block Reason**: Optional reason for blocking (for barber reference)
- **Temporary Blocks**: Time-limited blocks (e.g., 30 days)
- **Unblock Functionality**: Ability to unblock clients later

### Multi-Barber Support per Salon
- **Salon Management**: Create salon profile with multiple barbers
- **Barber Profiles**: Each barber has individual schedule and settings
- **Cross-Scheduling**: View all barbers' appointments in one calendar
- **Assignment**: Assign appointments to specific barbers
- **Barber Availability**: Per-barber working hours and days off
- **Owner Dashboard**: Salon-wide statistics and management
- **Shop Owner Visibility**: Shop owner can view appointments of their employees

### Marketing / Promotions
- **Promotional Codes**: Discount codes for appointments
- **Referral System**: Track referrals and reward clients
- **Email Marketing**: Send promotions to client list
- **SMS/WhatsApp Marketing**: Promotional messages to clients
- **Social Media Integration**: Share booking page on social platforms

### Custom Domain
- **Domain Mapping**: Use own domain (e.g., `book.johnbarber.com`)
- **SSL Certificate**: Automatic SSL setup
- **Branding Consistency**: Full control over booking page URL

### Google Calendar Integration
- **Scope**: Each employee has their own individual Google Calendar
- **Implementation**: Each shop owner with employees can add them, and each employee will have their own Google Calendar. Not limited to barbershops - applies to all shop owners who have employees and want to add them.
- **Read-Only Synchronization**: All appointments automatically sync to each employee's Google Calendar
- **One-Way Sync**: Appointments created in the platform appear in Google Calendar immediately
- **Event Details**: Each Google Calendar event includes:
  - Client name and service type
  - Client phone number
  - Direct link to dashboard for cancellation/editing
- **Cancellation Workflow**: 
  - Business owner can view all appointments in Google Calendar
  - To cancel an appointment, owner must use the dashboard (via link in event or direct login)
  - Cancellation from dashboard ensures:
    - Mandatory cancellation reason is captured
    - Automatic refund processing (if payment was collected)
    - WhatsApp notification sent to client with cancellation reason
- **Authentication**: Business owner connects Google Calendar account via OAuth
- **Dashboard Access**: Owner can access dashboard with email/password to manage appointments
- **Benefits**: 
  - View appointments in familiar calendar interface
  - Receive Google Calendar notifications for appointments
  - Quick access to dashboard via event link for management actions
- **Note**: Cancellations cannot be performed directly from Google Calendar to maintain business logic integrity (payment refunds, mandatory reasons, WhatsApp notifications)

### Advanced Branding and Message Customization
- **Full Theme Customization**: Multiple colors, fonts, layout options
- **Custom CSS**: Advanced styling options
- **Message Templates**: Extensive customization of all WhatsApp/email messages
- **Multiple Languages**: Support for different languages
- **Booking Page Layout**: Different layout options and templates

---

## Flows & Relationships

### Client Booking Flow
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
[If requireRegistrationBeforePayment = true] Enters full name and phone number
  ↓
Views cancellation policy warning message
  ↓
Processes payment (Mercado Pago or Credit/Debit Card)
  ↓
[If requireRegistrationBeforePayment = false] Enters full name and phone number
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

### Cancellation Flow
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

### Business Owner Dashboard Flow
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

### Platform Admin Configuration Flow (Payment & Cancellation Rules)
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

### WhatsApp Notification Flow
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

---

## Summary of Decisions Based on 70 Questions

### Users

#### Registration and Access
- **Yes**: Manual business registration required
- **Yes**: Email and password authentication (User model separate from Business)
- **Yes**: Email verification required
- **Yes**: Business category/rubro selection during registration (cannot be changed)
- **No**: No end client account required (booking without signup)
- **Future**: Optional end client accounts for booking history
- **No**: No social media login in MVP
- **Future**: OAuth integration (Google, Facebook)

#### User Roles
- **Yes**: End client role (implicit, no account)
- **Yes**: Platform Admin role (SUPER_ADMIN) - Central control
- **Yes**: Business owner role (OWNER) - Limited control
- **Future**: Business staff role (STAFF) - limited permissions

### Appointments

#### Booking Process
- **Yes**: Public booking page without login
- **Yes**: Real-time availability checking
- **Yes**: Prevent double booking
- **Yes**: Calendar view with time slots
- **No**: No booking approval required (automatic)
- **Yes**: Appointment duration configurable (15-90 minutes)
- **Yes**: Buffer time between appointments (optional)

#### Time Management
- **Yes**: Configurable working hours per day
- **Yes**: Different hours for different days
- **Yes**: Support for closed days
- **Yes**: Lunch break configuration
- **Yes**: Advance booking window (e.g., 30 days)
- **No**: No same-day booking restriction (configurable)
- **Future**: Recurring appointments support

#### Appointment Information
- **Yes**: Collect client name and phone number
- **Yes**: Phone number accepts both formats (international +1234567890 and local formats)
- **Yes**: Service selection required (Corte, Corte+Barba, Barba) with prices displayed
- **Yes**: Service duration affects time slot availability
- **No**: No email required (optional)
- **No**: No address collection in MVP
- **Future**: Additional service types (hair coloring, styling, etc.)
- **Future**: Notes/special requests field

### Cancellations

#### Cancellation Rules
- **Yes**: 24-hour cancellation rule enforced (for end clients)
- **Yes**: Cancellation via unique link (for end clients)
- **Yes**: Automatic slot freeing upon cancellation
- **Yes**: If cancellation attempted with <24 hours, slot becomes available for other clients (even though cancellation is blocked)
- **No**: No cancellation fees in MVP
- **Future**: Cancellation fees for late cancellations
- **Yes**: Admin and Business Owner can manually cancel turns
- **Yes**: MANDATORY cancellation reason required when cancelled by Admin or Owner
- **Yes**: Cancellation reason is automatically sent to the end client via WhatsApp
- **Yes**: Cancellation notifications sent to both parties

### Notifications

#### WhatsApp Integration
- **Yes**: WhatsApp confirmations upon booking
- **Yes**: WhatsApp reminders (24 hours before)
- **Yes**: WhatsApp cancellation confirmations
- **Future**: WhatsApp reminder 2 hours before
- **Yes**: Pre-approved message templates (required by WhatsApp Business API)
- **To Define**: Twilio vs WhatsApp Business API direct integration
- **No**: No SMS fallback in MVP
- **Future**: Email notifications as backup

#### Notification Content
- **Yes**: Include appointment date and time
- **Yes**: Include cancellation link
- **Yes**: Include barber contact information
- **Yes**: Include barber name and location
- **Future**: Include service type and pricing

### Payments

#### Payment Features
- **Yes**: Configurable payment system per business (set by admin in `/admin` panel)
  - **Payment Options**: Admin can configure percentage deposit (10%, 20%, 50%, etc.) OR full payment
  - **Payment Requirement**: Admin can set payment as required or optional per business
  - **Registration Before Payment**: Admin can configure if client must provide name/phone before payment or after
  - Payment amount calculated based on business configuration
  - If payment required: Payment must be completed to confirm booking
- **Yes**: Multiple payment processors:
  - **Mercado Pago**: Primary payment processor (especially for Latin America)
  - **Credit/Debit Card**: Supported via Mercado Pago and Stripe
  - Both methods available in payment step
- **Yes**: Payment status tracking (paid, pending, refunded, partially_refunded, not_required)
- **Yes**: Configurable refund policies per business (set by admin)
  - Full refund if cancelled within free window (configurable hours)
  - Partial or no refund if cancelled after free window (configurable)
  - Refunds processed via same payment provider (Mercado Pago or Stripe)
- **Yes**: Cancellation policy warning message displayed before payment step
- **Yes**: Payment step displayed during booking flow (if payment required)
- **Yes**: Secure payment processing with PCI compliance

### Statistics

#### Analytics and Reporting
- **No**: No statistics dashboard in MVP
- **Future**: Appointment statistics (count, trends)
- **Future**: Revenue statistics (if payments enabled)
- **Future**: Peak booking times analysis
- **Future**: Cancellation rate tracking
- **Future**: Client retention metrics
- **Future**: Export data to CSV/PDF

### Plans

#### Subscription Tiers
- **Yes**: Free/Basic plan (MVP features)
- **Future**: Premium plan with statistics
- **Future**: Multi-barber plan
- **No**: No usage-based pricing in MVP
- **Future**: Transaction fees for payment processing

### Business Owner Panel

#### Dashboard Features
- **Yes**: View upcoming appointments
- **Yes**: View past appointments
- **Yes**: Edit appointments (change date, time, client details, service)
- **Yes**: Cancel appointments manually
- **Yes**: Configure working hours
- **Yes**: Set service durations
- **Yes**: Update branding (logo, cover photo, primary color, description, texts)
- **Yes**: Manual time slot blocking (specific hours)
- **Yes**: Manual day blocking (full days)
- **Yes**: Activate/deactivate services
- **Note**: Payment system is fixed at 10% mandatory deposit (not configurable)
- **No**: No client database in MVP (only in Premium plan)
- **Future**: Client management and notes
- **Future**: Client blocking functionality

#### Profile Management
- **Yes**: Edit business name
- **Yes**: Upload logo and cover photo
- **Yes**: Set business description
- **Yes**: Set main brand color
- **Yes**: Customize booking page texts
- **Yes**: Business category/rubro (set once, cannot be changed)
- **Future**: Multiple logo/color themes
- **Future**: Custom domain configuration

### Scalability

#### Multi-Tenant Architecture
- **Yes**: Each business has isolated booking page
- **Yes**: URL slug based on business name (`/business-slug`)
- **Yes**: Independent schedules per business
- **Yes**: Multi-industry support (barbershops, salons, massage, spa, etc.)
- **Yes**: Business category/rubro field for industry classification
- **Future**: Multi-provider support within same business
- **Future**: Shared resources (e.g., client database) across providers in same business

#### Performance and Limits
- **No**: No appointment limits in MVP
- **Future**: Rate limiting for bookings
- **Yes**: Real-time availability updates
- **Future**: Caching for booking pages
- **Future**: CDN for static assets

#### Internationalization
- **Yes**: English and Spanish support in MVP (with language switcher button)
- **Yes**: Global timezone (single timezone for all barbers, not per-barber)
- **Future**: Additional languages
- **Future**: Per-barber timezone configuration
- **Future**: Currency support (for payments)

---

## Additional Considerations

### Data Privacy
- **GDPR Compliance**: Client data stored securely
- **Data Retention**: Define retention period for cancelled appointments
- **Right to Deletion**: Allow barbers to delete their data
- **Phone Number Privacy**: Hash or encrypt phone numbers

### Security
- **HTTPS**: All pages served over HTTPS
- **Input Validation**: Sanitize all user inputs
- **SQL Injection Prevention**: Use parameterized queries (Prisma)
- **Rate Limiting**: Prevent booking spam
- **Unique Links**: Cryptographically secure cancellation links

### Accessibility
- **WCAG Compliance**: Ensure booking page is accessible
- **Keyboard Navigation**: Support keyboard-only navigation
- **Screen Reader Support**: Proper ARIA labels
- **Color Contrast**: Meet contrast requirements

### Mobile Experience
- **Responsive Design**: Optimize for mobile devices
- **Touch-Friendly**: Large tap targets for time slots
- **Fast Loading**: Optimize for slower connections
- **Offline Support**: Future consideration for offline viewing

---

## Success Metrics

### Key Performance Indicators (KPIs)
- **User Adoption**: Number of registered businesses
- **Industry Distribution**: Businesses by category/rubro
- **Booking Volume**: Appointments booked per month
- **Cancellation Rate**: Percentage of cancelled appointments
- **User Retention**: Monthly active businesses
- **Payment Adoption**: Percentage of businesses using payment features
- **WhatsApp Delivery Rate**: Successful notification delivery
- **Page Load Time**: Booking page performance
- **Mobile Usage**: Percentage of bookings from mobile devices

### Goals for MVP Launch
- 50+ registered businesses in first 3 months
- Multiple industries represented (barbershops, salons, massage, etc.)
- 500+ appointments booked in first month
- <5% cancellation rate (excluding 24-hour rule blocks)
- 95%+ WhatsApp message delivery rate
- <2 second booking page load time
- 70%+ mobile booking rate

