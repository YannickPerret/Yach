const sqlite3 = require('sqlite3').verbose();
const { PrismaClient } = require('@prisma/client')

class Database {
    // Database singleton pattern construct
    constructor() {
        if (Database.instance) {
            throw new Error('Use Database.getInstance()');
        }
        this.init();
    }

    // Database singleton pattern init
    init() {
        this.db = new PrismaClient()
    }

    // Database singleton pattern getInstance
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
}

module.exports = Database;
