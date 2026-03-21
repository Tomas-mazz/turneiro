-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "syncedToUserId" TEXT;

-- CreateIndex
CREATE INDEX "Appointment_syncedToUserId_idx" ON "Appointment"("syncedToUserId");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_syncedToUserId_fkey" FOREIGN KEY ("syncedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
