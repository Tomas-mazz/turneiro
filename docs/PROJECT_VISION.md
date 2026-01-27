# Project Vision – Multi-Industry Appointment Booking SaaS

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
  - **Configurable Payment System**: Payment rules apply equally to all business categories (rubros) - percentage deposit, full payment, or no payment required
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
  - Priority support

### Google Calendar Integration (Main Feature)
- **Included as main option** (not part of Premium MVP)
- **Scope**: Each employee has their own individual Google Calendar
- **Features**:
  - Each shop owner with employees can add them, and each employee will have their own Google Calendar
  - Not limited to barbershops - applies to all shop owners who have employees and want to add them
  - View appointments in Google Calendar
  - One-way sync (appointments created in platform appear in Google Calendar)
  - Direct link to dashboard from calendar events
  - Business owner connects Google Calendar account via OAuth

### Multi-Barber Support (Future - Not in MVP)
- **Note**: Multi-barber is a current feature but NOT included in MVP
- **How it works**: Admin (platform admin, not shop owner) can add multiple barbers within the same barbershop
- **Each barber has**:
  - Individual calendar with independent schedules and availability
  - Own working hours configuration
- **Setup**: Shop owner must contact admin to add a new barber/employee and set up their working hours
- **Shop Owner Visibility**: Shop owner can view appointments of their employees
- **Future Pricing**: $29.99-$49.99/month per salon (when released)
- **Future Features**:
  - Salon owner dashboard
  - Cross-barber scheduling
  - Salon-level analytics
  - Team management tools

### Payment Options for Appointments (MVP)
- **Configurable Payment Rules (Apply Equally to All Rubros/Business Categories)**:
  - **Payment Behavior Options** (Only these 2 options):
    - **Option A**: Require payment of a percentage to make a reservation, with the option to pay the full amount if the customer chooses to
    - **Option B**: No payment required to make a reservation, while still offering the option of voluntary full payment
  - **Configuration**: Payment rules apply equally to all business categories (rubros)
  - **Advance Payment**: Admin can change percentage (e.g., 10%, 20%, 50%) OR set no payment required
  - **Payment Processing**: Payment rules are separated by client, not by rubro. Each client has their own rubro, conditions, and products configured. Admin configures payment rules when creating a new client with their specific rubro and conditions.
- **Payment Processing**: 
  - **Mercado Pago Integration**: Primary payment processor (especially for Latin America)
  - **Credit/Debit Card**: Supported via Mercado Pago and Stripe
  - Both payment methods available in payment step
- **Cancellation & Refund Rules (Set by Admin per Client)**:
  - **Configuration**: Admin loads cancellation rules in `/admin` panel when creating a new client with their rubro (business category)
  - **Rules Source**: Admin sets rules as specified by shop owner when creating the client
  - **No Limits**: No maximums or minimums - all rules are set manually by admin based on shop owner's requirements
  - **Free Cancellation Window**: Admin sets time before appointment for free cancellation (e.g., 24h, 48h) as specified by shop owner
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
