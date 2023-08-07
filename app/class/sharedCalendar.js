const { v4: uuidv4 } = require('uuid');
const Database = require('./database');

class SharedCalendar {
    constructor(config) {
        this.id = config.id || uuidv4();
        this.calendars = config.calendars || [];
        this.name = config.name;
    }

    add(calendar) {
        this.calendars.push(calendar);
    }

    remove(calendar) {
        this.calendars = this.calendars.filter(c => c.id !== calendar.id);
    }

    getSharedCalendar() {
        let outputCalendar = Ical.component(['vcalendar', [], []]);
        for (let calendar of this.calendars) {
            outputCalendar.addSubcomponent(calendar.outputCalendar);
        }
        return outputCalendar;
    }

    // dans persist il y à une table d'association (SharedCalendarAssociation) entre sharedCalendar et calendar qu'il faut remplir
    async persist() {
        try {
            await Database.db.sharedCalendar.create({
                data: {
                    id: this.id,
                    name: this.name,
                },
            });

            for (let calendar of this.calendars) {
                await Database.db.sharedCalendarAssociation.create({
                    data: {
                        calendarId: calendar.id,
                        sharedCalendarId: this.id
                    }
                });
            }
        } catch (err) {
            console.error(err);
        }
    }
    /*
       persist() {
        return new Promise(async (resolve, reject) => {
            try {
                let sharedCalendar = await Database.db.sharedCalendar.create({
                    data: {
                        id: this.id,
                        name: this.name,
                        calendars: {
                            connect: this.calendars.map(c => {
                                return { id: c.id }
                            })
                        }
                    }
                });
                resolve(sharedCalendar);
            } catch (err) {
                reject(err);
            }
        });
    }*/

    static async getAll() {
        try {
            let sharedCalendars = await Database.db.sharedCalendar.findMany({
                /*include: {
                    calendars: true
                }*/
            });

            return sharedCalendars
        } catch (err) {
            console.error(err);
        }
    }
}

module.exports = SharedCalendar;
