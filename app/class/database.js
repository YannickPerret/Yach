// @ts-check

const { PrismaClient } = require('@prisma/client')

/**
 * Class representing a database.
 */
class Database {
    /**
     * @type {PrismaClient}
     */
    db;

    /**
     * Singleton instance of the Database.
     * @type {Database}
     */
    static instance;

    constructor() {
        if (!Database.instance) {
            this.db = new PrismaClient({ log: ['error'] });
            Database.instance = this;
        }
        return Database.instance;
    }
}

/**
 * Singleton instance of the Database.
 * @type {Database}
 */
const instance = new Database();
Object.freeze(instance);

module.exports = instance;
