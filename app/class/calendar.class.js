const Ical = require('./adapter/ical.class');
const Event = require('./event.class');
const ICAL = require('ical.js');

class Calendar {

    constructor(config) {
        this.source = config.source;
        this.format = config.format;
        this.outputCalendar = Ical.component(['vcalendar', [], []]);
        this.events = [];
    }

    parseEvents = () => {
        if (this.source == null) throw new Error('No source file specified')

        switch (this.source.fileName.substring(this.source.fileName.lastIndexOf('.') + 1)) {
            case 'ics':
                let jcalData = Ical.parse(this.source.load());
                let comp = Ical.component(jcalData);

                comp.getAllSubcomponents('vevent').forEach((event) => {

                    let start = event.getFirstProperty('dtstart').getFirstValue();
                    let end = event.getFirstProperty('dtend').getFirstValue();

                    // Convert to Europe/Zurich timezone
                    start.zone = ICAL.TimezoneService.get('Europe/Zurich');
                    end.zone = ICAL.TimezoneService.get('Europe/Zurich');

                    // Update the event
                    event.updatePropertyWithValue('dtstart', start);
                    event.updatePropertyWithValue('dtend', end);


                    this.events.push(new Event({
                        start: start,
                        end: end,
                        summary: event.getFirstPropertyValue('summary'),
                        description: event.getFirstPropertyValue('description'),
                    }));
                });

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

}

module.exports = Calendar;
