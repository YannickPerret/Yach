const Database = require('./database');

class User {

    constructor(config) {
        this.id = config.id;
        this.username = config.username;
        this.token = config.token;
    }

    static async getById(id) {
        const user = await Database.getInstance().findUnique({
            where: {
                id: id
            }
        })
        return new User(user);
    }

    static async getBy(field, value) {
        const user = await Database.getInstance().user.findMany({
            where: {
                [field]: value
            }
        })
        return new User(user);
    }

    static async getByUsername(username) {
        const user = await Database.getInstance().user.findFirst({
            where: {
                username: username
            }
        })
        return new User(user);
    }

    static async create(user) {
        const newUser = await Database.getInstance().user.create({
            data: user
        })
        return new User(newUser);
    }

    static async update(id, user) {
        const updatedUser = await Database.getInstance().user.update({
            where: {
                id: id
            },
            data: user
        })
        return new User(updatedUser);
    }

    static async delete(id) {
        const deletedUser = await Database.getInstance().user.delete({
            where: {
                id: id
            }
        })
        return new User(deletedUser);
    }

    async persist() {
        const user = await Database.getInstance().user.upsert({
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

    async getCalendarWithEvents() {
        let calendars = await this.getCalendars();

        for (let calendar of calendars) {
            calendar = await this.fetchCalendarWithEvents(calendar);
        }

        return calendars;
    }

    // user have access to this calendar
    async hasCalendar(calendarId) {
        const calendar = await Database.getInstance().calendar.findUnique({
            where: {
                id: calendarId
            },
            include: {
                calendarUsersAssociations: {
                    where: {
                        userId: this.id
                    }
                }
            }
        });
        return calendar !== false;
    }

    /**
     * The function `getCalendars` retrieves the calendars associated with a user from the database and
     * returns them as an array of `Calendar` objects.
     * @returns <Promise>
     */
    async getCalendars() {
        let calendars = [];
        try {
            const userWithCalendars = await Database.getInstance().user.findUnique({
                where: {
                    id: this.id
                },
                include: {
                    calendarUsersAssociations: {
                        include: {
                            calendar: true
                        }
                    }
                }
            })
    
            if (!userWithCalendars) return [];
    
            for (const association of userWithCalendars.calendarUsersAssociations) {    
                calendars.push(association.calendar)
            }
        }
        catch (error) {
            console.log(error);
            calendars = [];
        }

        return calendars;
        
    }

    async fetchCalendarWithEvents(calendar) {
        const events = await Database.getInstance().calendarEventAssociation.findMany({
            where: { calendarId: calendar.id },
            include: { event: true }
        });
        calendar.events = events.map(assoc => assoc.event);

        const subCalendars = await Database.getInstance().calendarAssociation.findMany({
            where: { parentCalendarId: calendar.id },
            include: { childCalendar: true }
        });
    
        calendar.children = [];
        for (let subCalendarAssoc of subCalendars) {
            const subCalendar = await this.fetchCalendarWithEvents(subCalendarAssoc.childCalendar);
            calendar.children.push(subCalendar);
        }
    
        return calendar;
    }

    static async getAll() {
        const users = await Database.getInstance().user.findMany();
        return users.map(user => new User(user));
    }
}

module.exports = User;