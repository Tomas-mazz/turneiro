# Payment Backend Setup (Mercado Pago)

This document describes the payment backend implementation for Mercado Pago.

## What Was Implemented

### 1. Prisma Schema
- Payment fields on `Appointment` model:
  - `paymentProvider` - MERCADOPAGO
  - `paymentIntentId` - Mercado Pago Preference ID
  - `paymentAmount` - Amount paid (deposit or full)
  - `refundAmount` - Amount refunded (if cancelled)
  - `paymentStatus` - PENDING, PAID, REFUNDED, PARTIALLY_REFUNDED

### 2. Mercado Pago Service (`src/services/mercadopago.service.ts`)
- `createPreference()` - Create payment preference
- `processRefund()` - Process refund
- `verifyWebhookSignature()` - Verify webhook (basic implementation)
- `getPayment()` - Get payment details

### 3. Payment Controller & Routes
- **POST /api/payments/create-intent**
  - Body: `{ appointmentId, provider }` (provider: MERCADOPAGO)
  - Returns: `{ preferenceId, initPoint, amount }`
  - Calculates payment amount based on BusinessSettings (percentage or full)

- **POST /api/payments/confirm**
  - Body: `{ appointmentId, paymentIntentId }` (paymentIntentId = preferenceId)
  - Updates appointment status to PAID

### 4. Webhook
- **POST /api/webhooks/mercadopago**
  - Handles IPN notifications
  - Updates appointment based on payment status (approved, rejected, refunded)

### 5. Refund Logic
- Refunds on cancellation (client within free window, or owner cancel) via Mercado Pago.

## Setup Instructions

### 1. Install Dependencies
- `mercadopago` (backend)

### 2. Environment Variables
Add to `backend/.env`:

```bash
# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN="your-mercadopago-access-token"
MERCADOPAGO_PUBLIC_KEY="your-mercadopago-public-key"
MERCADOPAGO_WEBHOOK_SECRET="your-mercadopago-webhook-secret"
MERCADOPAGO_WEBHOOK_ENABLED=false
```

Frontend (`.env.local`): `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`

### 3. Testing Webhooks Locally
Use ngrok to expose the backend, then set the webhook URL in Mercado Pago to `https://your-ngrok-url.ngrok.io/api/webhooks/mercadopago`

## Mercado Pago Checkout Bricks (Requisitos previos)

Ver [Requisitos previos - Mercado Pago](https://www.mercadopago.com.ar/developers/es/docs/checkout-bricks/prerequisites):

| Requisito | Descripción |
|-----------|-------------|
| **Aplicación** | Crear una aplicación en [Tus integraciones](https://www.mercadopago.com.ar/developers/panel/app). |
| **Cuenta de vendedor** | Mercado Pago o Mercado Libre. |
| **Credenciales** | Public key (frontend) y Access Token (backend). |
| **SDK** | Backend: `mercadopago`. Frontend: `@mercadopago/sdk-react`. |

### Flujo con Bricks

1. Usuario elige "Pagar con Mercado Pago" en el paso de pago.
2. Frontend llama `POST /api/payments/create-intent` con `provider: 'MERCADOPAGO'`.
3. Backend crea la preferencia y devuelve `preferenceId` y `amount`.
4. Se muestra el Payment Brick en la misma página.
5. Tras el pago, Mercado Pago redirige a las `back_urls` o el webhook actualiza el estado.

## Notes

- Amounts in ARS (Mercado Pago).
- Failed refunds are logged but do not block cancellation.
