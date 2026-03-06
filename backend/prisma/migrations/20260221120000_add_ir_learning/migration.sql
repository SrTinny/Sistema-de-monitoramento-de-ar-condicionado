-- AlterTable
ALTER TABLE "AirConditioner"
ADD COLUMN "irSignals" JSONB,
ADD COLUMN "irLearnState" TEXT,
ADD COLUMN "irLearnButton" TEXT,
ADD COLUMN "irLearnMessage" TEXT,
ADD COLUMN "irLearnUpdatedAt" TIMESTAMP(3);
