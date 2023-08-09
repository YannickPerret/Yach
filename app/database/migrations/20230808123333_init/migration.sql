-- CreateTable
CREATE TABLE "Calendar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "type" TEXT NOT NULL DEFAULT 'OTHER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "parent_calendar_id" TEXT
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "summary" TEXT NOT NULL,
    "sequence" INTEGER,
    "status" TEXT,
    "transp" TEXT NOT NULL,
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
CREATE INDEX "Event_id_idx" ON "Event"("id");
