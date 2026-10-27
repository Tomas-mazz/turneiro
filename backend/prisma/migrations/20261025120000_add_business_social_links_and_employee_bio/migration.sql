-- Public contact / social links for the booking page.
ALTER TABLE "Business" ADD COLUMN "whatsapp" TEXT,
ADD COLUMN "instagram" TEXT,
ADD COLUMN "facebook" TEXT,
ADD COLUMN "mapsUrl" TEXT,
ADD COLUMN "googleReviewsUrl" TEXT;

-- Short public description per employee.
ALTER TABLE "Employee" ADD COLUMN "bio" TEXT;
