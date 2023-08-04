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

                /*for (let event of this.events) {
                    await event.persist();
                }*/

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
        await Database.db.calendar.create({
            data: {
                id: this.id,
                name: "teeeeest",
            },
        });
        console.log("calendar persisted")
    }

    static async getCalendarById(id) {
        try {
            let calendarData = await Database.db.calendar.findUnique({
                where: {
                    id: id,
                },
                include: {
                    events: true,
                },
            });
            
            if (calendarData.events) {
                calendarData.events = calendarData.events.map(eventData => new Event(eventData));
            }
            
            let calendar = new Calendar(calendarData);
            
            return calendar;
        } catch (error) {
            console.error(error);
        }   
    }
}

module.exports = Calendar;
