-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
