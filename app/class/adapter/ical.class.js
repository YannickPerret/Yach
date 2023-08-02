const ICAL = require('ical.js');

class Ical {

    static parse(file) {
        return ICAL.parse(file);
    }

    static component(jcalData) {
        return new ICAL.Component(jcalData);
    }

    static getTZ(timezone) {
        return ICAL.TimezoneService.get(timezone);
    }
}

module.exports = Ical;
