-- Mercado Pago OAuth connection metadata per business.
ALTER TABLE "BusinessSettings" ADD COLUMN IF NOT EXISTS "mercadoPagoRefreshToken" TEXT;
ALTER TABLE "BusinessSettings" ADD COLUMN IF NOT EXISTS "mercadoPagoTokenExpiresAt" TIMESTAMP(3);
ALTER TABLE "BusinessSettings" ADD COLUMN IF NOT EXISTS "mercadoPagoUserId" TEXT;
ALTER TABLE "BusinessSettings" ADD COLUMN IF NOT EXISTS "mercadoPagoConnectedAt" TIMESTAMP(3);
