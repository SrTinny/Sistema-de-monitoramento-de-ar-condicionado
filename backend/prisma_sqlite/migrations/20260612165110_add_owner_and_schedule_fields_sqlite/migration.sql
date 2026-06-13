-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AirConditioner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "room" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "humidity" REAL,
    "pendingCommand" TEXT,
    "temperature" REAL,
    "setpoint" REAL DEFAULT 22,
    "lastHeartbeat" DATETIME,
    "irSignals" JSONB,
    "irSignalLigar" TEXT,
    "irSignalDesligar" TEXT,
    "irSignalTempUp" TEXT,
    "irSignalTempDown" TEXT,
    "irLearnState" TEXT,
    "irLearnButton" TEXT,
    "irLearnRaw" TEXT,
    "irLearnMessage" TEXT,
    "irLearnUpdatedAt" DATETIME,
    "ownerId" TEXT,
    CONSTRAINT "AirConditioner_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduledAt" DATETIME,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "airConditionerId" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringTime" TEXT,
    "recurrenceRule" TEXT,
    "targetTemperature" REAL,
    CONSTRAINT "Schedule_airConditionerId_fkey" FOREIGN KEY ("airConditionerId") REFERENCES "AirConditioner" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AirConditioner_deviceId_key" ON "AirConditioner"("deviceId");

-- CreateIndex
CREATE INDEX "AirConditioner_lastHeartbeat_idx" ON "AirConditioner"("lastHeartbeat");
