-- CreateEnum
CREATE TYPE "ScheduleAction" AS ENUM ('LIGAR', 'DESLIGAR');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('PENDENTE', 'EXECUTADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "action" "ScheduleAction" NOT NULL,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "airConditionerId" TEXT NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_airConditionerId_fkey" FOREIGN KEY ("airConditionerId") REFERENCES "AirConditioner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
