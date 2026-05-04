-- CreateTable
CREATE TABLE "ServiceAddOn" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceAddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAddOnService" (
    "serviceAddOnId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "ServiceAddOnService_pkey" PRIMARY KEY ("serviceAddOnId","serviceId")
);

-- CreateTable
CREATE TABLE "ServiceAddOnSubService" (
    "serviceAddOnId" TEXT NOT NULL,
    "subServiceId" TEXT NOT NULL,

    CONSTRAINT "ServiceAddOnSubService_pkey" PRIMARY KEY ("serviceAddOnId","subServiceId")
);

-- CreateTable
CREATE TABLE "AppointmentAddOn" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "serviceAddOnId" TEXT,
    "nameSnapshot" TEXT NOT NULL,
    "priceSnapshot" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentAddOn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceAddOn_businessId_idx" ON "ServiceAddOn"("businessId");

-- CreateIndex
CREATE INDEX "ServiceAddOnService_serviceId_idx" ON "ServiceAddOnService"("serviceId");

-- CreateIndex
CREATE INDEX "ServiceAddOnSubService_subServiceId_idx" ON "ServiceAddOnSubService"("subServiceId");

-- CreateIndex
CREATE INDEX "AppointmentAddOn_appointmentId_idx" ON "AppointmentAddOn"("appointmentId");

-- AddForeignKey
ALTER TABLE "ServiceAddOn" ADD CONSTRAINT "ServiceAddOn_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAddOnService" ADD CONSTRAINT "ServiceAddOnService_serviceAddOnId_fkey" FOREIGN KEY ("serviceAddOnId") REFERENCES "ServiceAddOn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAddOnService" ADD CONSTRAINT "ServiceAddOnService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAddOnSubService" ADD CONSTRAINT "ServiceAddOnSubService_serviceAddOnId_fkey" FOREIGN KEY ("serviceAddOnId") REFERENCES "ServiceAddOn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAddOnSubService" ADD CONSTRAINT "ServiceAddOnSubService_subServiceId_fkey" FOREIGN KEY ("subServiceId") REFERENCES "SubService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentAddOn" ADD CONSTRAINT "AppointmentAddOn_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentAddOn" ADD CONSTRAINT "AppointmentAddOn_serviceAddOnId_fkey" FOREIGN KEY ("serviceAddOnId") REFERENCES "ServiceAddOn"("id") ON DELETE SET NULL ON UPDATE CASCADE;
