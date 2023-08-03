-- CreateTable
CREATE TABLE "Calendar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "summary" TEXT NOT NULL,
    "sequence" INTEGER,
    "status" TEXT,
    "transp" TEXT,
    "rRule" TEXT,
    "start" TEXT NOT NULL,
    "end" TEXT NOT NULL,
    "drStamp" TEXT NOT NULL,
    "categories" TEXT,
    "location" TEXT,
    "geo" TEXT,
    "description" TEXT,
    "url" TEXT,
    "calendarId" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Event_calendarId_idx" ON "Event"("calendarId");
