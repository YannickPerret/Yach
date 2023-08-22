// @ts-check

const ICAL = require('ical.js');
const Ical = require('../adapter/ical');

const Event = require('../event');


class ParseData {

    async parseDataICS(data) {
        let events = [];
        let jcalData = await Ical.parse(data);
        let comp = Ical.component(jcalData);

        for (let event of comp.getAllSubcomponents('vevent')) {
            let start = event.getFirstProperty('dtstart').getFirstValue().toJSDate().toISOString();
            let end = event.getFirstProperty('dtend').getFirstValue().toJSDate().toISOString();

            let newEvent = new Event({
                id: event.getFirstPropertyValue('uid'),
                start: start,
                end: end,
                summary: event.getFirstPropertyValue('summary'),
                description: event.getFirstPropertyValue('description'),
                transp: event.getFirstPropertyValue('transp')
            });

            events.push(newEvent);
        }

        return events;
    }
}

module.exports = ParseData;