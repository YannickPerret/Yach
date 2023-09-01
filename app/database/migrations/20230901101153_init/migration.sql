-- CreateTable
CREATE TABLE "Calendar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "type" TEXT NOT NULL DEFAULT 'BASIC',
    "classification" TEXT NOT NULL DEFAULT 'OTHER',
    "url" TEXT,
    "color" TEXT DEFAULT '#000000',
    "class" TEXT NOT NULL DEFAULT 'PUBLIC',
    "right" TEXT NOT NULL DEFAULT 'WRITE',
    "syncExpressionCron" TEXT DEFAULT '0 0 * * *',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CalendarAssociation" (
    "parentCalendarId" TEXT NOT NULL,
    "childCalendarId" TEXT NOT NULL,

    PRIMARY KEY ("parentCalendarId", "childCalendarId")
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

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "CalendarUserAssociation" (
    "userId" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,

    PRIMARY KEY ("userId", "calendarId")
);

-- CreateIndex
CREATE INDEX "Calendar_id_idx" ON "Calendar"("id");

-- CreateIndex
CREATE INDEX "Event_id_idx" ON "Event"("id");

-- CreateIndex
CREATE INDEX "User_id_idx" ON "User"("id");
