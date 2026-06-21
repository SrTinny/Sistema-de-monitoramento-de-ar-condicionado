-- AlterEnum
ALTER TYPE "ScheduleAction" ADD VALUE 'AJUSTAR_TEMPERATURA';

-- AlterTable
ALTER TABLE "AirConditioner" ADD COLUMN     "ownerId" TEXT;

-- CreateTable
CREATE TABLE "Operation" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "airConditionerId" TEXT,

    CONSTRAINT "Operation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AirConditioner_lastHeartbeat_idx" ON "AirConditioner"("lastHeartbeat");

-- AddForeignKey
ALTER TABLE "AirConditioner" ADD CONSTRAINT "AirConditioner_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_airConditionerId_fkey" FOREIGN KEY ("airConditionerId") REFERENCES "AirConditioner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
