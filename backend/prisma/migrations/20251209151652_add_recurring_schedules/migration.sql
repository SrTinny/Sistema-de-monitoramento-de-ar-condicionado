-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurringTime" TEXT,
ALTER COLUMN "scheduledAt" DROP NOT NULL;
