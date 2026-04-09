-- Add created-by SELLER traceability to Business
ALTER TABLE "Business" ADD COLUMN "createdBySellerId" TEXT;

-- FK: if seller user is deleted, keep business and null out creator
ALTER TABLE "Business"
ADD CONSTRAINT "Business_createdBySellerId_fkey"
FOREIGN KEY ("createdBySellerId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Business_createdBySellerId_idx" ON "Business"("createdBySellerId");

