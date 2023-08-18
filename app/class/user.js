const Database = require('./database');
const Calendar = require('./calendar');

class User {

    constructor(config) {
        this.id = config.id;
        this.username = config.username;
        this.token = config.token;
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
        const user = await Database.db.user.findMany({
            where: {
                [field]: value
            }
        })
        return new User(user);
    }

    static async getByUsername(username) {
        const user = await Database.db.user.findFirst({
            where: {
                username: username
            }
        })
        return new User(user);
    }

    static async create(user) {
        const newUser = await Database.db.user.create({
            data: user
        })
        return new User(newUser);
    }

    static async update(id, user) {
        const updatedUser = await Database.db.user.update({
            where: {
                id: id
            },
            data: user
        })
        return new User(updatedUser);
    }

    static async delete(id) {
        const deletedUser = await Database.db.user.delete({
            where: {
                id: id
            }
        })
        return new User(deletedUser);
    }

    async persist() {
        const user = await Database.db.user.upsert({
            where: {
                id: this.id
            },
            update: {
                username: this.username,
                token: this.token,
            },
            create: {
                username: this.username,
                token: this.token,
            }
        })
        return new User(user);
    }

    /**
     * The function `getCalendars` retrieves the calendars associated with a user from the database and
     * returns them as an array of `Calendar` objects.
     * @returns <Promise>
     */
    async getCalendars() {
        const userWithCalendars = await Database.db.user.findUnique({
            where: {
                id: this.id
            },
            include: {
                CalendarUsersAssociations: {
                    include: {
                        calendar: true
                    }
                }
            }
        })

        if (!userWithCalendars) return [];

    
        let calendars = [];
        for (const association of userWithCalendars.CalendarUsersAssociations) {    
            calendars.push(association.calendar)
        }
        return calendars;
    }


    async getCalendarWithEvents() {
        const dbCalendarsUser = await Database.db.user.findUnique({
            where: {
                id: this.id
            },
            include: {
                CalendarUsersAssociations: {
                    include: {
                        calendar: {
                            include: {
                                CalendarEventAssociations: {
                                    include: {
                                        event: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    
        if (!dbCalendarsUser) return [];
    
        let calendarsWithEvents = dbCalendarsUser.CalendarUsersAssociations.map(association => {
            let calendar = association.calendar;
            calendar.events = calendar.CalendarEventAssociations.map(eventAssoc => eventAssoc.event);
            delete calendar.CalendarEventAssociations;
            return calendar;
        });
    
        return calendarsWithEvents;
    }    
}

module.exports = User;