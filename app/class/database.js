// @ts-check

const { PrismaClient } = require('@prisma/client')

/**
 * Class representing a database.
 */
class Database {
    /**
     * Singleton instance of the Database.
     * @type {Database}
     */
    static instance;

    constructor() {
    }

    static getInstance() {
        if (!Database.instance) {
            Database.instance = new PrismaClient({ log: ['error'] });
        }

        return Database.instance;
    }
}

/**
 * Singleton instance of the Database.
 * @type {Database}
 */

module.exports = Database;
