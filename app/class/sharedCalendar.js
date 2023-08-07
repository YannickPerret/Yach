const { v4: uuidv4 } = require('uuid');
const Database = require('./database');
const Ical = require('./adapter/ical');

class SharedCalendar {
    constructor(config) {
        this.id = config.id || uuidv4();
        this.calendars = config.calendars || [];
        this.name = config.name;
        this.outputCalendar = Ical.component(['vcalendar', [], []]);
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

    static async getById(id) {
        try {
            let sharedCalendar = await Database.db.sharedCalendar.findUnique({
                where: {
                    id: id,
                },
                include: {
                    SharedCalendarAssociations: {
                        include: {
                            calendar: true
                        }
                    }
                }
            });

            if (!sharedCalendar) {
                console.error(`No shared calendar found with ID ${id}`);
                return null;
            }

            return new SharedCalendar(sharedCalendar);
        } catch (err) {
            console.error(err);
        }
    }

//http://localhost:3000/api/v1/calendar/3645e741-f5d6-4738-b41c-4ea8fdd423bf
    generate() {
        this.calendars.forEach((calendar) => {

            console.log("fsfsdfsdfsgfdgdfg")
            calendar.events.forEach((event) => {
                console.log(event)
                let vevent = Ical.component('vevent');

                vevent.updatePropertyWithValue('dtstart', event.start);
                vevent.updatePropertyWithValue('dtend', event.end);

                vevent.updatePropertyWithValue('summary', event.summary);

                this.outputCalendar.addSubcomponent(vevent);
            });
        });

        console.log(this.outputCalendar.toString())

        
        return this.outputCalendar.toString();

        /*this.events.forEach((event) => {
            let vevent = Ical.component('vevent');

            vevent.updatePropertyWithValue('dtstart', event.start);
            vevent.updatePropertyWithValue('dtend', event.end);

            vevent.updatePropertyWithValue('summary', event.summary);

            this.outputCalendar.addSubcomponent(vevent);
        });
        return this.outputCalendar.toString();*/

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
