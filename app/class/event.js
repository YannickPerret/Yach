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

  formatEvent(event) {
    // Ici, vous pouvez implémenter la logique pour formater l'événement

  }

  parseEvent(event) {
    // Ici, vous pouvez implémenter la logique pour analyser l'événement
  }

  clearEvent() {
    // Ici, vous pouvez implémenter la logique pour réinitialiser les propriétés de l'événement
  }

  async persist() {
    let storedEvent;

    // find if event exist before create
    const event = await Database.db.event.findUnique({
      where: {
        id: this.id
      }
    });

    if (event) {
      // update event
      storedEvent = await Database.db.event.update({
        where: {
          id: this.id
        },
        data: this._eventData()
      });
    }
    else {
      storedEvent = await Database.db.event.create({
        data: this._eventData()
      });
    }

    await this._associateWithCalendar(storedEvent.id);
  }

  _eventData() {
    return {
      id: this.id,
      summary: this.summary,
      description: this.description, // Assuming you'd want the actual description
      start: this.start.toISOString(),
      end: this.end.toISOString(),
      sequence: 1,
      status: "CONFIRMED",
      transp: this.transp,
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