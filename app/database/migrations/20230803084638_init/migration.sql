-- CreateTable
CREATE TABLE "Calendar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Event" (
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
    "url" TEXT NOT NULL
);
