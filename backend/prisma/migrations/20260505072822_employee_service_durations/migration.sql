-- CreateTable
CREATE TABLE "EmployeeServiceDuration" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "serviceId" TEXT,
    "subServiceId" TEXT,
    "duration" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeServiceDuration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmployeeServiceDuration_employeeId_idx" ON "EmployeeServiceDuration"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeServiceDuration_serviceId_idx" ON "EmployeeServiceDuration"("serviceId");

-- CreateIndex
CREATE INDEX "EmployeeServiceDuration_subServiceId_idx" ON "EmployeeServiceDuration"("subServiceId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeServiceDuration_employeeId_serviceId_key" ON "EmployeeServiceDuration"("employeeId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeServiceDuration_employeeId_subServiceId_key" ON "EmployeeServiceDuration"("employeeId", "subServiceId");

-- AddForeignKey
ALTER TABLE "EmployeeServiceDuration" ADD CONSTRAINT "EmployeeServiceDuration_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeServiceDuration" ADD CONSTRAINT "EmployeeServiceDuration_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeServiceDuration" ADD CONSTRAINT "EmployeeServiceDuration_subServiceId_fkey" FOREIGN KEY ("subServiceId") REFERENCES "SubService"("id") ON DELETE CASCADE ON UPDATE CASCADE;
