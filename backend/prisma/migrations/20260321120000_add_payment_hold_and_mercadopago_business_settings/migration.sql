-- Payment hold window for pending Mercado Pago checkout; optional payment + MP credentials per business.
-- IF NOT EXISTS keeps deploy safe when a DB was already altered via db push (drift).

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "paymentHoldExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "BusinessSettings" ADD COLUMN IF NOT EXISTS "paymentOptionalEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "BusinessSettings" ADD COLUMN IF NOT EXISTS "mercadoPagoPublicKey" TEXT;
ALTER TABLE "BusinessSettings" ADD COLUMN IF NOT EXISTS "mercadoPagoAccessToken" TEXT;
ALTER TABLE "BusinessSettings" ADD COLUMN IF NOT EXISTS "mercadoPagoWebhookSecret" TEXT;
