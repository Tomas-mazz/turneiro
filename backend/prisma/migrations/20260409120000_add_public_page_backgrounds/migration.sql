-- Nullable: NULL means use the app's built-in default for that theme.
ALTER TABLE "BusinessSettings" ADD COLUMN "publicPageBackgroundDark" TEXT;
ALTER TABLE "BusinessSettings" ADD COLUMN "publicPageBackgroundLight" TEXT;
