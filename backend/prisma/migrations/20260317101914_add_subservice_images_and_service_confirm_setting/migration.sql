-- AlterTable
ALTER TABLE "BusinessSettings" ADD COLUMN     "showServiceConfirmModal" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SubService" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
