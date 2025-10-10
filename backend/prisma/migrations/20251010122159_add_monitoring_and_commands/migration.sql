-- AlterTable
ALTER TABLE "AirConditioner" ADD COLUMN     "humidity" DOUBLE PRECISION,
ADD COLUMN     "pendingCommand" TEXT,
ADD COLUMN     "temperature" DOUBLE PRECISION,
ALTER COLUMN "status" SET DEFAULT 'offline';
