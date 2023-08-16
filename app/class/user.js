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
    
        if (!userWithCalendars || !userWithCalendars.CalendarUsersAssociations) return [];
    
        const calendars = userWithCalendars.CalendarUsersAssociations.map(association => {
            return new Calendar(association.calendar);
        })
    
        return calendars;
    }

    async getCalendarWithEvents() {
        const userWithCalendars = await Database.db.user.findUnique({
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
        })

        
    
        if (!userWithCalendars || !userWithCalendars.CalendarUsersAssociations) return [];
        const calendars = userWithCalendars.CalendarUsersAssociations.map(association => {
            const calendarData = association.calendar;
            // Converting CalendarEventAssociations to just events for the Calendar class
            if (calendarData.CalendarEventAssociations) {
                calendarData.events = calendarData.CalendarEventAssociations.map(assoc => assoc.event);
                delete calendarData.CalendarEventAssociations;
            }

            return new Calendar(calendarData);
        })

        return calendars;
    }
    
}

module.exports = User;