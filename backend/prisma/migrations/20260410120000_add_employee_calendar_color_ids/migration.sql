-- Add per-employee Google Calendar colorIds (owner calendar + staff calendar)

ALTER TABLE "Employee"
ADD COLUMN IF NOT EXISTS "ownerCalendarColorId" TEXT;

ALTER TABLE "Employee"
ADD COLUMN IF NOT EXISTS "staffCalendarColorId" TEXT;

