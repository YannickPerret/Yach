/*
  Warnings:

  - Added the required column `calendarId` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "summary" TEXT NOT NULL,
    "sequence" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "transp" TEXT NOT NULL,
    "rRule" TEXT NOT NULL,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "drStamp" DATETIME NOT NULL,
    "categories" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "geo" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    CONSTRAINT "Event_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "Calendar" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("categories", "createdAt", "description", "drStamp", "end", "geo", "location", "rRule", "sequence", "start", "status", "summary", "transp", "updatedAt", "url", "uuid") SELECT "categories", "createdAt", "description", "drStamp", "end", "geo", "location", "rRule", "sequence", "start", "status", "summary", "transp", "updatedAt", "url", "uuid" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
