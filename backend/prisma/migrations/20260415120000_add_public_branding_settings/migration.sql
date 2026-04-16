-- Public booking branding settings (derived theme).
ALTER TABLE "BusinessSettings"
  ADD COLUMN "publicBrandColor" TEXT,
  ADD COLUMN "publicBrandIntensity" TEXT,
  ADD COLUMN "publicUseGradient" BOOLEAN DEFAULT FALSE;

