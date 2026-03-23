-- Run ONCE in Supabase (or Neon) SQL Editor for the **production** database that powers Vercel.
-- Use the same project/DB as DATABASE_URL in Vercel — often different from your local .env.
--
-- After this succeeds, Prisma Client will see the columns. Optionally sync migration history:
--   DATABASE_URL="postgresql://..." npx prisma migrate deploy
-- (uses IF NOT EXISTS in the migration file; safe if columns already exist)

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "paymentHoldExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "BusinessSettings" ADD COLUMN IF NOT EXISTS "paymentOptionalEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "BusinessSettings" ADD COLUMN IF NOT EXISTS "mercadoPagoPublicKey" TEXT;
ALTER TABLE "BusinessSettings" ADD COLUMN IF NOT EXISTS "mercadoPagoAccessToken" TEXT;
ALTER TABLE "BusinessSettings" ADD COLUMN IF NOT EXISTS "mercadoPagoWebhookSecret" TEXT;

-- Post-payment QStash / side-effects idempotency (optional; also in migrate)
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "paymentConfirmationJobsEnqueuedAt" TIMESTAMP(3);
