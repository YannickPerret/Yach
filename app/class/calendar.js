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
        await Database.db.calendar.upsert({
            where: {
                id: this.id
            },
            update: {
                name: this.name,
                type: this.type,
                parentCalendarId: this.parentCalendarId 
            },
            create: {
                id: this.id,
                name: this.name,
                type: this.type,
                parentCalendarId: this.parentCalendarId
            }
        });
    }

    async addEvent(event) {
        if (this.type === "SHARED") {
          const childCalendars = await this.getChildCalendars();
          for (const childCalendar of childCalendars) {
            await childCalendar._associateEventWithCalendar(event.id);
          }
        } else {
          await this._associateEventWithCalendar(event.id);
        }
      }

    async getEvents() {
        try {
            // Get all associations for the given calendar
            const associations = await Database.db.calendarEventAssociation.findMany({
                where: {
                    calendarId: this.id
                },
                include: {
                    event: true
                }
            });
    
            // Extract the events from the associations
            const eventsData = associations.map(assoc => assoc.event);

            return eventsData.map(eventData => new Event(eventData));
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    async updateEvents() {
        for (let event of this.events) {
            await Database.db.event.delete({
                where: {
                    id: event.id
                }
            });
        }
    
        for (let event of this.events) {
            await event.persist();
        }
    
        console.log("Events updated for calendar with id:", this.id);
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
    
            const calendar = new Calendar(calendarData);
    
            // Get child calendars and their events if any.
            const childCalendars = await calendar.getChildCalendars();
            for (const childCalendar of childCalendars) {
                const childEvents = await childCalendar.getEvents();
                childEvents.forEach(event => event.calendarId = childCalendar.id);
                calendar.events.push(...childEvents);
            }
    
            return calendar;
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

    async _associateEventWithCalendar(eventId) {
        const associationExists = await Database.db.calendarEventAssociation.findUnique({
          where: {
            eventId_calendarId: {
              eventId: eventId,
              calendarId: this.id
            }
          }
        });
    
        if (!associationExists) {
          await Database.db.calendarEventAssociation.create({
            data: {
              eventId: eventId,
              calendarId: this.id
            }
          });
        }
      }
}

module.exports = Calendar;
