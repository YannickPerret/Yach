const Database = require('./database');

class User {
    
    constructor(config) {
        this.id = config.id;
        this.username = config.username;
        this.token = config.token;
        this.calendars = config.calendars;
    }

    static async getById(id) {
        const user = await Database.db.findUnique({
            where: {
                id: id
            }
        })
        return new User(user);
    }

    static async getBy(field, value) {
        const user = await Database.db.findUnique({
            where: {
                [field]: value
            }
        })
        return new User(user);
    }

    static async create(user) {
        const newUser = await Database.db.create({
            data: user
        })
        return new User(newUser);
    }

    static async update(id, user) {
        const updatedUser = await Database.db.update({
            where: {
                id: id
            },
            data: user
        })
        return new User(updatedUser);
    }

    static async delete(id) {
        const deletedUser = await Database.db.delete({
            where: {
                id: id
            }
        })
        return new User(deletedUser);
    }

    async persist() {
        const user = await Database.db.upsert({
            where: {
                id: this.id
            },
            update: {
                username: this.username,
                token: this.token,
                calendars: this.calendars
            },
            create: {
                username: this.username,
                token: this.token,
                calendars: this.calendars
            }
        })
        return new User(user);
    }

    async getCalendars() {
        const calendars = await Database.db.findUnique({
            where: {
                id: this.id
            },
            select: {
                calendars: true
            }
        })
        return calendars.calendars.map(calendar => {
            return new Calendar(calendar);
        })
    }

}

module.exports = User;