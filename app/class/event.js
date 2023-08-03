const Database = require('./database');

class Event {
  constructor(config) {
    this.id = config.uuid;
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
    await Database.db.event.create({
      data: {
        id: this.id,
        summary: this.summary,
        description: this.description,
        start: this.start,
        end: this.end,
        calendarId: this.calendarId,
      },
    });
  }
}


module.exports = Event;