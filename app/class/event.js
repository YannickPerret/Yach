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

  formatEvent() {
    // Ici, vous pouvez implémenter la logique pour formater l'événement

  }

  static async parseEvent() {

  }

  clearEvent() {
    // Ici, vous pouvez implémenter la logique pour réinitialiser les propriétés de l'événement
  }

  async persist() {

    const storedEvent = await Database.db.event.upsert({
      where: {
        id: this.id
      },
      update: this._eventData(),
      create: this._eventData()
    });

    await this._associateWithCalendar(storedEvent.id);
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
      transp: this.transp,
      drStamp: "ffwsdfsfd",
      categories: "test",
      location: "test",
      geo: "test",
      url: "test",
      rRule: "test",
    };
  }
}

module.exports = Event;