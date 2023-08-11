const Database = require('./database');

class Event {
  constructor(config) {
    this.id = config.id;
    this.summary = config.summary;
    this.sequence = config.sequence;
    this.status = config.status;
    this.transp = config.transp;
    this.rRule = config.rule;
    this.start = config.start;
    this.end = config.end;
    this.drStamp = config.drstamp;
    this.categories = config.categories;
    this.location = config.location;
    this.geo = config.geo;
    this.description = config.description;
    this.url = config.url;
    this.calendarId = config.calendarId;
  }

  static async getById(id) {
    const eventWithAssociation = await Database.db.event.findUnique({
      where: {
        id: id
      },
      include: {
        CalendarEventAssociations: true
      },
    });

    if (!eventWithAssociation) return null;

    const event = {
      ...eventWithAssociation,
      calendarId: eventWithAssociation.CalendarEventAssociations[0]?.calendarId || null
    }

    return new Event(event);
}


  async persist() {
    const storedEvent = await Database.db.event.upsert({
      where: {
        id: this.id
      },
      update: this._eventData(),
      create: this._eventData()
    });


    //await this._associateWithCalendar(storedEvent.id);
  }

  _eventData() {
    return {
      id: this.id,
      summary: this.summary,
      description: this.description,
      start: this.start.toISOString(),
      end: this.end.toISOString(),
      sequence: 1,
      status: "CONFIRMED",
      transp: this.transp || "OPAQUE",
      drStamp: "ffwsdfsfd",
      categories: "test",
      location: "test",
      geo: "test",
      url: "test",
      rRule: "test",
    };
  }

  async _associateWithCalendar(eventId) {
    const associationExists = await Database.db.calendarEventAssociation.findUnique({
      where: {
        eventId_calendarId: {
          eventId: eventId,
          calendarId: this.calendarId
        }
      }
    });

    if (!associationExists) {
      await Database.db.calendarEventAssociation.create({
        data: {
          eventId: eventId,
          calendarId: this.calendarId
        }
      });
    }
  }
}

module.exports = Event;
