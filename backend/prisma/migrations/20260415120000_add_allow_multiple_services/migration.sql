-- Add allowMultipleServices to BusinessSettings
ALTER TABLE "BusinessSettings"
ADD COLUMN "allowMultipleServices" BOOLEAN NOT NULL DEFAULT false;

