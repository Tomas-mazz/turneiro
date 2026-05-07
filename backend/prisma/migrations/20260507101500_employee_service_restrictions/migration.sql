-- CreateTable
CREATE TABLE "EmployeeServiceRestriction" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "serviceId" TEXT,
    "subServiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeServiceRestriction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmployeeServiceRestriction_employeeId_idx" ON "EmployeeServiceRestriction"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeServiceRestriction_serviceId_idx" ON "EmployeeServiceRestriction"("serviceId");

-- CreateIndex
CREATE INDEX "EmployeeServiceRestriction_subServiceId_idx" ON "EmployeeServiceRestriction"("subServiceId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeServiceRestriction_employeeId_serviceId_key" ON "EmployeeServiceRestriction"("employeeId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeServiceRestriction_employeeId_subServiceId_key" ON "EmployeeServiceRestriction"("employeeId", "subServiceId");

-- AddForeignKey
ALTER TABLE "EmployeeServiceRestriction" ADD CONSTRAINT "EmployeeServiceRestriction_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeServiceRestriction" ADD CONSTRAINT "EmployeeServiceRestriction_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeServiceRestriction" ADD CONSTRAINT "EmployeeServiceRestriction_subServiceId_fkey" FOREIGN KEY ("subServiceId") REFERENCES "SubService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

