-- CreateTable
CREATE TABLE "Calendar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "type" TEXT NOT NULL DEFAULT 'OTHER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SharedCalendar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "type" TEXT NOT NULL DEFAULT 'OTHER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SharedCalendarAssociation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sharedCalendarId" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL
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
    "url" TEXT
);

-- CreateTable
CREATE TABLE "CalendarEventAssociation" (
    "eventId" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,

    PRIMARY KEY ("eventId", "calendarId")
);

-- CreateIndex
CREATE INDEX "Calendar_id_idx" ON "Calendar"("id");

-- CreateIndex
CREATE INDEX "idx_sharedCalendarId" ON "SharedCalendarAssociation"("sharedCalendarId");

-- CreateIndex
CREATE INDEX "Event_id_idx" ON "Event"("id");
