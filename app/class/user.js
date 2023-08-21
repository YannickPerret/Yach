const Database = require('./database');


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

    async fetchCalendarWithEvents(calendar) {
        // Récupère les événements associés à ce calendrier
        const events = await Database.db.calendarEventAssociation.findMany({
            where: { calendarId: calendar.id },
            include: { event: true }
        });
        calendar.events = events.map(assoc => assoc.event);

        // Récupère récursivement les sous-calendriers
        const subCalendars = await Database.db.calendar.findMany({ where: { parentCalendarId: calendar.id } });
        for (let subCalendar of subCalendars) {
            subCalendar = await this.fetchCalendarWithEvents(subCalendar);
        }
        calendar.subCalendar = subCalendars;

        return calendar;
    }

    async getCalendarWithEvents() {
        let calendars = await this.getCalendars();

        // Pour chaque calendrier, récupère ses événements et sous-calendriers
        for (let calendar of calendars) {
            calendar = await this.fetchCalendarWithEvents(calendar);
        }
        return calendars;
    }
}

module.exports = User;