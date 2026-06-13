/*
  Warnings:

  - You are about to drop the column `recurrenceRule` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the column `targetTemperature` on the `Schedule` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Operation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "airConditionerId" TEXT,
    CONSTRAINT "Operation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Operation_airConditionerId_fkey" FOREIGN KEY ("airConditionerId") REFERENCES "AirConditioner" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Schedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduledAt" DATETIME,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "airConditionerId" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringTime" TEXT,
    CONSTRAINT "Schedule_airConditionerId_fkey" FOREIGN KEY ("airConditionerId") REFERENCES "AirConditioner" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Schedule" ("action", "airConditionerId", "createdAt", "id", "isRecurring", "recurringTime", "scheduledAt", "status") SELECT "action", "airConditionerId", "createdAt", "id", "isRecurring", "recurringTime", "scheduledAt", "status" FROM "Schedule";
DROP TABLE "Schedule";
ALTER TABLE "new_Schedule" RENAME TO "Schedule";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
