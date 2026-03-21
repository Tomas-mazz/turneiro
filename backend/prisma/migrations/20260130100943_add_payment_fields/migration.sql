-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "googleEventId" TEXT,
ADD COLUMN     "paymentAmount" DOUBLE PRECISION,
ADD COLUMN     "paymentIntentId" TEXT,
ADD COLUMN     "paymentProvider" TEXT,
ADD COLUMN     "refundAmount" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "googleCalendarId" TEXT,
ADD COLUMN     "googleRefreshToken" TEXT;

-- CreateIndex
CREATE INDEX "Appointment_paymentIntentId_idx" ON "Appointment"("paymentIntentId");

-- CreateIndex
CREATE INDEX "Appointment_googleEventId_idx" ON "Appointment"("googleEventId");
