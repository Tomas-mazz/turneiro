-- Per-employee schedule; days without a row use the business working hours.
CREATE TABLE "EmployeeWorkingHours" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "lunchStart" TEXT,
    "lunchEnd" TEXT,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeWorkingHours_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmployeeWorkingHours_employeeId_dayOfWeek_key" ON "EmployeeWorkingHours"("employeeId", "dayOfWeek");

ALTER TABLE "EmployeeWorkingHours" ADD CONSTRAINT "EmployeeWorkingHours_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Prisma connects as the table owner and bypasses RLS; this blocks Supabase's REST API.
ALTER TABLE "EmployeeWorkingHours" ENABLE ROW LEVEL SECURITY;
