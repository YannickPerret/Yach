//Enuma class model

class Enum {
    constructor(name, values) {
        this.name = name;
        this.values = values;
    }
}

class CalendarType extends Enum {
    constructor() {
        super('CalendarType', ['PUBLIC', 'PRIVATE']);
    }
}

class CalendarClassification extends Enum {
    constructor() {
        super('CalendarClassification', ['PERSONAL', 'Professional', 'OTHER']);
    }
}

module.exports = Enum;