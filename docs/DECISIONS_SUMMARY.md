# Summary of Decisions Based on 70 Questions

## Users

### Registration and Access
- **Yes**: Manual business registration required
- **Yes**: Email and password authentication (User model separate from Business)
- **Yes**: Email verification required
- **Yes**: Business category/rubro selection during registration (cannot be changed)
- **No**: No end client account required (booking without signup)
- **Future**: Optional end client accounts for booking history
- **No**: No social media login in MVP
- **Future**: OAuth integration (Google, Facebook)

### User Roles
- **Yes**: End client role (implicit, no account)
- **Yes**: Platform Admin role (SUPER_ADMIN) - Central control
- **Yes**: Business owner role (OWNER) - Limited control
- **Future**: Business staff role (STAFF) - limited permissions

## Appointments

### Booking Process
- **Yes**: Public booking page without login
- **Yes**: Real-time availability checking
- **Yes**: Prevent double booking
- **Yes**: Calendar view with time slots
- **No**: No booking approval required (automatic)
- **Yes**: Appointment duration configurable (15-90 minutes)
- **Yes**: Buffer time between appointments (optional)

### Time Management
- **Yes**: Configurable working hours per day
- **Yes**: Different hours for different days
- **Yes**: Support for closed days
- **Yes**: Lunch break configuration
- **Yes**: Advance booking window (e.g., 30 days)
- **No**: No same-day booking restriction (configurable)
- **Future**: Recurring appointments support

### Appointment Information
- **Yes**: Collect client name and phone number
- **Yes**: Phone number accepts both formats (international +1234567890 and local formats)
- **Yes**: Service selection required (Corte, Corte+Barba, Barba) with prices displayed
- **Yes**: Service duration affects time slot availability
- **No**: No email required (optional)
- **No**: No address collection in MVP
- **Future**: Additional service types (hair coloring, styling, etc.)
- **Future**: Notes/special requests field

## Cancellations

### Cancellation Rules
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

## Notifications

### WhatsApp Integration
- **Yes**: WhatsApp confirmations upon booking
- **Yes**: WhatsApp reminders (24 hours before)
- **Yes**: WhatsApp cancellation confirmations
- **Future**: WhatsApp reminder 2 hours before
- **Yes**: Pre-approved message templates (required by WhatsApp Business API)
- **To Define**: Twilio vs WhatsApp Business API direct integration
- **No**: No SMS fallback in MVP
- **Future**: Email notifications as backup

### Notification Content
- **Yes**: Include appointment date and time
- **Yes**: Include cancellation link
- **Yes**: Include barber contact information
- **Yes**: Include barber name and location
- **Future**: Include service type and pricing

## Payments

### Payment Features
- **Yes**: Configurable payment system - payment rules apply equally to all business categories (rubros)
  - **Payment Options**: Admin can configure percentage deposit (10%, 20%, 50%, etc.) OR full payment OR no payment required
  - **Payment Configuration**: Payment rules are separated by client, not by rubro. Each client has their own rubro, conditions, and products configured. Admin configures payment rules when creating a new client with their specific rubro and conditions.
  - **Registration Before Payment**: Name and phone are ALWAYS required before payment - NOT configurable, shop owners cannot decide this
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

## Statistics

### Analytics and Reporting
- **No**: No statistics dashboard in MVP
- **Future**: Appointment statistics (count, trends)
- **Future**: Revenue statistics (if payments enabled)
- **Future**: Peak booking times analysis
- **Future**: Cancellation rate tracking
- **Future**: Client retention metrics
- **Future**: Export data to CSV/PDF

## Plans

### Subscription Tiers
- **Yes**: Free/Basic plan (MVP features)
- **Future**: Premium plan with statistics
- **Future**: Multi-barber plan
- **No**: No usage-based pricing in MVP
- **Future**: Transaction fees for payment processing

## Business Owner Panel

### Dashboard Features
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

### Profile Management
- **Yes**: Edit business name
- **Yes**: Upload logo and cover photo
- **Yes**: Set business description
- **Yes**: Set main brand color
- **Yes**: Customize booking page texts
- **Yes**: Business category/rubro (set once, cannot be changed)
- **Future**: Multiple logo/color themes
- **Future**: Custom domain configuration

## Scalability

### Multi-Tenant Architecture
- **Yes**: Each business has isolated booking page
- **Yes**: URL slug based on business name (`/business-slug`)
- **Yes**: Independent schedules per business
- **Yes**: Multi-industry support (barbershops, salons, massage, spa, etc.)
- **Yes**: Business category/rubro field for industry classification
- **Future**: Multi-provider support within same business
- **Future**: Shared resources (e.g., client database) across providers in same business

### Performance and Limits
- **No**: No appointment limits in MVP
- **Future**: Rate limiting for bookings
- **Yes**: Real-time availability updates
- **Future**: Caching for booking pages
- **Future**: CDN for static assets

### Internationalization
- **Yes**: English and Spanish support in MVP (with language switcher button)
- **No**: Timezone configuration will not be implemented (deferred for later if project grows)
- **Future**: Additional languages
- **Future**: Timezone configuration (if project grows)
- **Future**: Currency support (for payments)
