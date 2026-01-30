# Payment Backend Setup

This document describes the payment backend implementation for Stripe and Mercado Pago.

## What Was Implemented

### 1. Prisma Schema Updates
- Added payment fields to `Appointment` model:
  - `paymentProvider` - STRIPE or MERCADOPAGO
  - `paymentIntentId` - Stripe Payment Intent ID or Mercado Pago Preference ID
  - `paymentAmount` - Amount paid (deposit or full)
  - `refundAmount` - Amount refunded (if cancelled)
  - Updated `paymentStatus` to include PARTIALLY_REFUNDED

### 2. Payment Services
- **Stripe Service** (`src/services/stripe.service.ts`):
  - `createPaymentIntent()` - Create payment intent with metadata
  - `processRefund()` - Process full or partial refund
  - `verifyWebhookSignature()` - Verify webhook signature
  - `getPaymentIntent()` - Get payment intent details

- **Mercado Pago Service** (`src/services/mercadopago.service.ts`):
  - `createPreference()` - Create payment preference
  - `processRefund()` - Process refund
  - `verifyWebhookSignature()` - Verify webhook (basic implementation)
  - `getPayment()` - Get payment details

### 3. Payment Controller & Routes
- **POST /api/payments/create-intent**
  - Body: `{ appointmentId, provider }` (provider: STRIPE or MERCADOPAGO)
  - Returns: `{ clientSecret, paymentIntentId, amount }` for Stripe or `{ preferenceId, initPoint, amount }` for Mercado Pago
  - Calculates payment amount based on BusinessSettings (percentage or full)

- **POST /api/payments/confirm**
  - Body: `{ appointmentId, paymentIntentId }`
  - Verifies payment and updates appointment status to PAID

### 4. Webhook Handlers
- **POST /api/webhooks/stripe**
  - Handles: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
  - Updates appointment paymentStatus automatically

- **POST /api/webhooks/mercadopago**
  - Handles IPN notifications
  - Updates appointment based on payment status

### 5. Refund Logic
- Added automatic refund processing to cancellation functions:
  - `cancelAppointmentService()` - Client cancellation (within free window)
  - `cancelAppointmentByOwnerService()` - Owner cancellation (always full refund)
- Refunds are processed through the original payment provider
- Appointment status updates to REFUNDED or PARTIALLY_REFUNDED

### 6. Seed Updates
- Updated `BusinessSettings` in seed with payment configuration:
  - `paymentRequired: true`
  - `paymentType: 'PERCENTAGE'`
  - `depositPercentage: 10`
  - `freeCancellationWindow: 24`

## Setup Instructions

### 1. Install Dependencies
Already installed:
- `stripe` (for Stripe integration)
- `mercadopago` (for Mercado Pago integration)

### 2. Environment Variables
Add to `backend/.env`:

```bash
# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN="your-mercadopago-access-token"
MERCADOPAGO_PUBLIC_KEY="your-mercadopago-public-key"
MERCADOPAGO_WEBHOOK_SECRET="your-mercadopago-webhook-secret"
```

### 3. Run Database Migration
```bash
cd backend
npx prisma migrate dev --name add_payment_fields
```

### 4. Reseed Database (Optional)
```bash
npm run db:seed
```

## Testing Webhooks Locally

### Stripe
Use Stripe CLI to forward webhooks:
```bash
stripe listen --forward-to http://localhost:3001/api/webhooks/stripe
```
This will give you a webhook secret to add to `.env`

### Mercado Pago
Use ngrok or similar to expose local server:
```bash
ngrok http 3001
```
Then configure the webhook URL in Mercado Pago dashboard to `https://your-ngrok-url.ngrok.io/api/webhooks/mercadopago`

## Payment Flow

1. **Client selects service and time** on public booking page
2. **Client enters name and phone** (required before payment)
3. **Frontend calls POST /api/payments/create-intent** with appointmentId and provider
4. **Backend calculates payment amount** based on BusinessSettings
5. **Backend creates payment intent/preference** and returns to frontend
6. **Client completes payment** using Stripe Elements or Mercado Pago SDK
7. **Webhook confirms payment** and updates appointment to PAID
8. **Booking is confirmed** and notifications sent

## Cancellation & Refund Flow

### Client Cancellation (Within Free Window)
1. Client clicks cancellation link
2. System checks if within free cancellation window (24h by default)
3. If yes: Process full refund automatically, update appointment to CANCELLED + REFUNDED
4. If no: Show error, no cancellation allowed

### Owner Cancellation
1. Owner cancels from dashboard with mandatory reason
2. System processes full refund automatically (business's responsibility)
3. Appointment updated to CANCELLED + REFUNDED
4. Client receives notification

## API Endpoints Summary

```
POST /api/payments/create-intent
  → Create payment intent (Stripe) or preference (Mercado Pago)

POST /api/payments/confirm
  → Confirm payment completion

POST /api/webhooks/stripe
  → Stripe webhook handler (payment events)

POST /api/webhooks/mercadopago
  → Mercado Pago webhook handler (IPN notifications)
```

## Next Steps (Frontend)

To complete the payment integration, the frontend needs:

1. Add `'payment'` step to booking flow (between `'form'` and `'done'`)
2. Install Stripe Elements or Mercado Pago SDK
3. Call `/api/payments/create-intent` after client enters their info
4. Display payment UI (Stripe card element or Mercado Pago checkout)
5. Handle payment confirmation and redirect to `'done'` step

## Notes

- All amounts are in the currency specified (USD for Stripe by default, ARS for Mercado Pago)
- Stripe amounts are converted to cents internally
- Refunds are processed asynchronously through webhooks
- Failed refunds are logged but don't block cancellation (admin must handle manually)
- Payment provider is stored per appointment for proper refund routing
