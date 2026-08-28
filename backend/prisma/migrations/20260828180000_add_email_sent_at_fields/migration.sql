-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "confirmationSentAt" TIMESTAMP(3);
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "employeeNotificationSentAt" TIMESTAMP(3);
