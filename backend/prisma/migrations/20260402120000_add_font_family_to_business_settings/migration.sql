-- Add font family preference for public booking pages.
ALTER TABLE "BusinessSettings"
ADD COLUMN IF NOT EXISTS "fontFamily" TEXT NOT NULL DEFAULT 'ROBOTO';

