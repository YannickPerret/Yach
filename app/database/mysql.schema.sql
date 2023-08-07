CREATE TABLE `Calendar` (
    `id` VARCHAR(255) PRIMARY KEY,
    `name` VARCHAR(255) NULL,
    `type` VARCHAR(255) NOT NULL DEFAULT 'OTHER',
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE `SharedCalendar` (
    `id` VARCHAR(255) PRIMARY KEY,
    `name` VARCHAR(255) NULL,
    `type` VARCHAR(255) NOT NULL DEFAULT 'OTHER',
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE `SharedCalendarAssociation` (
    `sharedCalendarId` VARCHAR(255) NOT NULL,
    `calendarId` VARCHAR(255) NOT NULL,
    PRIMARY KEY (`sharedCalendarId`, `calendarId`),
    FOREIGN KEY (`sharedCalendarId`) REFERENCES `SharedCalendar`(`id`),
    FOREIGN KEY (`calendarId`) REFERENCES `Calendar`(`id`)
);

CREATE INDEX `idx_sharedCalendarId` ON `SharedCalendarAssociation` (`sharedCalendarId`);

CREATE TABLE `Event` (
    `id` VARCHAR(255) PRIMARY KEY,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `summary` VARCHAR(255) NOT NULL,
    `sequence` INT NULL,
    `status` VARCHAR(255) NULL,
    `transp` VARCHAR(255) NULL,
    `rRule` VARCHAR(255) NULL,
    `start` VARCHAR(255) NOT NULL,
    `end` VARCHAR(255) NOT NULL,
    `drStamp` VARCHAR(255) NOT NULL,
    `categories` VARCHAR(255) NULL,
    `location` VARCHAR(255) NULL,
    `geo` VARCHAR(255) NULL,
    `description` VARCHAR(255) NULL,
    `url` VARCHAR(255) NULL
);

CREATE TABLE `CalendarEventAssociation` (
    `eventId` VARCHAR(255) NOT NULL,
    `calendarId` VARCHAR(255) NOT NULL,
    PRIMARY KEY (`eventId`, `calendarId`),
    FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`),
    FOREIGN KEY (`calendarId`) REFERENCES `Calendar`(`id`)
);

CREATE INDEX `idx_eventId` ON `Event` (`id`);
