-- Création de la table Calendar
CREATE TABLE `Calendar` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `name` VARCHAR(255) DEFAULT NULL,
    `type` VARCHAR(255) DEFAULT 'OTHER',
    `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `parentCalendarId` CHAR(36) DEFAULT NULL,
    FOREIGN KEY (`parentCalendarId`) REFERENCES `Calendar`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    INDEX (`id`)
);

-- Création de la table Event
CREATE TABLE `Event` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `summary` VARCHAR(255) NOT NULL,
    `sequence` INT DEFAULT NULL,
    `status` VARCHAR(255) DEFAULT NULL,
    `transp` VARCHAR(255) NOT NULL,
    `rRule` VARCHAR(255) DEFAULT NULL,
    `start` VARCHAR(255) NOT NULL,
    `end` VARCHAR(255) NOT NULL,
    `drStamp` VARCHAR(255) NOT NULL,
    `categories` VARCHAR(255) DEFAULT NULL,
    `location` VARCHAR(255) DEFAULT NULL,
    `geo` VARCHAR(255) DEFAULT NULL,
    `description` TEXT DEFAULT NULL,
    `url` VARCHAR(255) DEFAULT NULL,
    INDEX (`id`)
);

-- Création de la table CalendarEventAssociation
CREATE TABLE `CalendarEventAssociation` (
    `eventId` CHAR(36) NOT NULL,
    `calendarId` CHAR(36) NOT NULL,
    PRIMARY KEY (`eventId`, `calendarId`),
    FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`),
    FOREIGN KEY (`calendarId`) REFERENCES `Calendar`(`id`)
);
