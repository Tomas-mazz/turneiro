-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "employeeId" TEXT;

-- AlterTable
ALTER TABLE "BlockedSlot" ADD COLUMN     "employeeId" TEXT;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "isOwner" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "BlockedSlot_employeeId_idx" ON "BlockedSlot"("employeeId");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedSlot" ADD CONSTRAINT "BlockedSlot_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
