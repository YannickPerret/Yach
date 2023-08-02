const fileManager = require('./fileManager.class');

class Calendar {

    constructor(config) {
        this.source = config.source;
        this.format = config.format;
        this.outputCalendar = new ICAL.Component(['vcalendar', [], []]);
        this.events = [];
    }

    parseEvents = (source) => {
        console.log(`Processing ${source}`)
        switch (source.substring(source.lastIndexOf('.') + 1)) {
            case 'ics':
                //this.#formatEvent(source);
                break;
            case 'json':
                // code blockx
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

    //Private methods


    // event ICS to object data
    #formatEvent = () => {
        try {
            if (source == null) throw new Error('No source file specified')

            let file = fileManager(source, 'utf8');
            
            let jcalData = ICAL.parse(file);
            let comp = new ICAL.Component(jcalData);

            // Convert all events to the same timezone
            comp.getAllSubcomponents('vevent').forEach((event) => {
                let start = event.getFirstProperty('dtstart').getFirstValue();
                let end = event.getFirstProperty('dtend').getFirstValue();

                // Convert to Europe/Zurich timezone
                start.zone = ICAL.TimezoneService.get('Europe/Zurich');
                end.zone = ICAL.TimezoneService.get('Europe/Zurich');

                // Update the event
                event.updatePropertyWithValue('dtstart', start);
                event.ucomppdatePropertyWithValue('dtend', end);

                // Add the event to the global calendar
                this.outputCalendar.addSubcomponent(event);
            });

        } catch (err) {
            console.error(err);
        }
    }

    #formatToJson = (source) => {

    }

    #formatToCsv = (source) => {

    }

    #formatToXlsx = (source) => {

    }
}

exports.default = Calendar;