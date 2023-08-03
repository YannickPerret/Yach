const { PrismaClient } = require('@prisma/client')

class Database {
    constructor() {
        if (!Database.instance) {
            this.db = new PrismaClient({log:['error']})
            Database.instance = this;
        }
        return Database.instance;
    }
}

const instance = new Database();
Object.freeze(instance);

module.exports = instance;
