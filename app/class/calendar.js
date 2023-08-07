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
    }

    parseEvents = async () => {
        if (this.source == null) throw new Error('No source file specified')

        switch (this.source.fileName.substring(this.source.fileName.lastIndexOf('.') + 1)) {

            case 'ics':
                let jcalData = Ical.parse(this.source.load());
                let comp = Ical.component(jcalData);

                for (let event of comp.getAllSubcomponents('vevent')) {
                    let start = event.getFirstProperty('dtstart').getFirstValue().toJSDate();
                    let end = event.getFirstProperty('dtend').getFirstValue().toJSDate();

                    // Convert to Europe/Zurich timezone
                    start.zone = ICAL.TimezoneService.get('Europe/Zurich');
                    end.zone = ICAL.TimezoneService.get('Europe/Zurich');

                    let newEvent = new Event({
                        uuid: event.getFirstPropertyValue('uid'),
                        start: start,
                        end: end,
                        summary: event.getFirstPropertyValue('summary'),
                        description: event.getFirstPropertyValue('description'),
                        calendarId: this.id
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

            vevent.updatePropertyWithValue('dtstart', event.start);
            vevent.updatePropertyWithValue('dtend', event.end);

            vevent.updatePropertyWithValue('summary', event.summary);

            this.outputCalendar.addSubcomponent(vevent);
        });
        return this.outputCalendar.toString();
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
                }
            });
        }
        else {
            await Database.db.calendar.create({
                data: {
                    id: this.id,
                    name: this.name,
                    type: this.type,
                },
            });
            console.log("calendar persisted")
        }
    }

    static async getCalendarById(id) {
        try {
            let calendarData = await Database.db.calendar.findUnique({
                where: {
                    id: id,
                },
                include: {
                    CalendarEventAssociations: {
                        include: {
                            event: true
                        }
                    }
                }
            });
    
            if (!calendarData) {
                console.error(`No calendar found with ID ${id}`);
                return null;
            }
    
            if (calendarData.CalendarEventAssociations) {
                calendarData.events = calendarData.CalendarEventAssociations.map(association => new Event(association.event));
                delete calendarData.CalendarEventAssociations; // Optional: remove the association data if you no longer need it
            }
    
            let calendar = new Calendar(calendarData);
            return calendar;
    
        } catch (error) {
            console.error(error);
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
                calendarsData = await Database.db.calendar.findMany({
                });
            }

            let calendars = calendarsData.map(calendarData => new Calendar(calendarData));

            return calendars;
        } catch (error) {
            console.error(error);
        }
    }
}

module.exports = Calendar;
