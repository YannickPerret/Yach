const Ical = require('./adapter/ical');
const Event = require('./event');
const ICAL = require('ical.js');
const Database = require('./database');
const { v4: uuidv4 } = require('uuid');

class Calendar {

    constructor(config) {
        this.id = config.id || uuidv4();
        this.source = config.source;
        this.format = config.format;
        this.outputCalendar = Ical.component(['vcalendar', [], []]);
        this.events = config.events || [];
        this.name = config.name;
        this.type = config.type;
        this.parentCalendarId = config.parentCalendarId;
    }

    parseEvents = async () => {
        if (this.source == null) throw new Error('No source file specified')

        switch (this.source.fileName.substring(this.source.fileName.lastIndexOf('.') + 1)) {
            case 'ics':
                let jcalData = await Ical.parse(this.source.load());
                let comp = Ical.component(jcalData);

                for (let event of comp.getAllSubcomponents('vevent')) {
                    let start = event.getFirstProperty('dtstart').getFirstValue().toJSDate();
                    let end = event.getFirstProperty('dtend').getFirstValue().toJSDate();

                    // Convert to Europe/Zurich timezone
                    start.zone = ICAL.TimezoneService.get('Europe/Zurich');
                    end.zone = ICAL.TimezoneService.get('Europe/Zurich');

                    let newEvent = new Event({
                        id: event.getFirstPropertyValue('uid'),
                        start: start,
                        end: end,
                        summary: event.getFirstPropertyValue('summary'),
                        description: event.getFirstPropertyValue('description'),
                        calendarId: this.id,
                        transp: event.getFirstPropertyValue('transp'),
                    });
                    this.events.push(newEvent);
                }

                break;
            case 'json':
                // code block
                break;
            case 'csv':
                // code block
                break;
            case 'xlsx':
                // code block
                break;
            default:
                console.log("no file recognized")
        }
    }

    generate = () => {
        this.events.forEach((event) => {
            let vevent = Ical.component('vevent');
            vevent.updatePropertyWithValue('uid', event.id);
            vevent.updatePropertyWithValue('dtstart', event.start);
            vevent.updatePropertyWithValue('dtend', event.end);

            vevent.updatePropertyWithValue('summary', event.summary);

            this.outputCalendar.addSubcomponent(vevent);
        });
        return this.outputCalendar.toString();
    }

    async addChildCalendar(calendar) {
        calendar.parentCalendarId = this.id;
        await calendar.persist();
    }

    async getChildCalendars() {
        const childCalendars = await Calendar.getAll({ parentCalendarId: this.id });
        if (!childCalendars) {
            return [];
        }
        return childCalendars;
    }

    async persist() {
        // find if calendar exist before create
        const calendar = await Database.db.calendar.findUnique({
            where: {
                id: this.id
            }
        });

        if (calendar) {
            // update calendar
            await Database.db.calendar.update({
                where: {
                    id: this.id
                },
                data: {
                    name: this.name,
                    type: this.type,
                    parentCalendarId: this.parentCalendarId 
                }
            });
            console.log("calendar updated")
        } else {
            await Database.db.calendar.create({
                data: {
                    id: this.id,
                    name: this.name,
                    type: this.type,
                    parentCalendarId: this.parentCalendarId
                }
            });
            console.log("calendar persisted")
        }
    }


    async getEvents() {
        try {
            let eventsData = await Database.db.event.findMany({
                where: {
                    calendarId: this.id
                }
            });

            console.log(eventsData)

            return eventsData.map(eventData => new Event(eventData));
        } catch (error) {
            console.error(error);
        }
    }


    static async getById(id) {
        try {
            const calendarData = await Database.db.calendar.findUnique({
                where: { id },
                include: {
                    CalendarEventAssociations: {
                        include: {
                            event: true
                        }
                    },
                    subCalendars: true
                }
            });
    
            if (!calendarData) {
                return null;
            }
    
            // Convert associated events into Event instances
            if (calendarData.CalendarEventAssociations) {
                calendarData.events = calendarData.CalendarEventAssociations.map(association => new Event(association.event));
                delete calendarData.CalendarEventAssociations;
            }
    
            return new Calendar(calendarData);
        } catch (error) {
            console.error("Error fetching calendar by ID:", error);
            throw error; 
        }
    }
    
    
    // get all calendars with filter no required
    static async getAll(filter = null) {
        try {
            let calendarsData 
            if (filter != null) {
                calendarsData = await Database.db.calendar.findMany({
                    where: {
                        ...filter
                    },
                });
            }
            else {
                calendarsData = await Database.db.calendar.findMany();
            }

            let calendars = calendarsData.map(calendarData => new Calendar(calendarData));

            return calendars;
        } catch (error) {
            console.error(error);
        }
    }
}

module.exports = Calendar;
