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

        return user.map(user => new User(user));
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

     // user have access to this calendar
     async haveAccessToCalendar(calendarId) {
        try {
            const calendar = await Database.getInstance().user.findUnique({
                where: {
                    id: this.id
                },
                include: {
                    calendarUsersAssociations: {
                        where: {
                            calendarId: calendarId
                        }
                    }
                }
            });
            return calendar.calendarUsersAssociations.length > 0;
        } catch (error) {
            console.error("Erreur lors de la vérification de l'accès au calendrier:", error);
            return false; 
        }
    }
    

    async hasRightOnCalendar(calendarId, right) {
        const calendar = await Database.getInstance().user.findUnique({
            where: {
                id: this.id
            },
            include: {
                calendarUsersAssociations: {
                    where: {
                        calendarId: calendarId
                    }
                }
            }
        });
        return calendar.calendarUsersAssociations[0].right === right;
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

    async addSubscribeCalendar(calendarId) {
        const calendar = await Database.getInstance().calendar.findUnique({
            where: {
                id: calendarId,
            }
        });

        if (!calendar) return false;

        const association = await Database.getInstance().CalendarUserAssociation.create({
            data: {
                calendarId: calendarId,
                userId: this.id,
            }
        });
        return association;
    }

    async removeSubscribeCalendar(calendarId) {
        const calendar = await Database.getInstance().CalendarUserAssociation.findUnique({
            where: {
                userId_calendarId: {
                    calendarId: calendarId,
                    userId: this.id
                }
            }
        });        

        if (!calendar) return false;
        
        const association = await Database.getInstance().CalendarUserAssociation.delete({
            where: {
                userId_calendarId: {
                    calendarId: calendarId,
                    userId: this.id
                }
            }
        });
        

        return association;
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