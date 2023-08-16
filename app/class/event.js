// @ts-check

const Database = require('./database');

/**
 * @typedef {Object} EventType
 * @property {string} id
 * @property {string} [summary]
 * @property {number|null} [sequence]
 * @property {string|null} [status]
 * @property {string} [transp]
 * @property {string|null} [rRule]
 * @property {Date|string} start
 * @property {Date|string} end
 * @property {string} [drStamp]
 * @property {string|null} [categories]
 * @property {string|null} [location]
 * @property {string|null} [geo]
 * @property {string|null} [description]
 * @property {string|null} [url]
 * @property {string|null} calendarId
 **/


class Event {
  /**
    * @param {EventType} config
  */
  constructor(config) {
    this.id = config.id;
    this.summary = config.summary;
    this.sequence = config.sequence;
    this.status = config.status;
    this.transp = config.transp;
    this.rRule = config.rRule;
    this.start = config.start;
    this.end = config.end;
    this.drStamp = config.drStamp;
    this.categories = config.categories;
    this.location = config.location;
    this.geo = config.geo;
    this.description = config.description;
    this.url = config.url;
    this.calendarId = config.calendarId;
  }

   /**
   * Retrieves an event by its ID.
   * @param {string} id - The ID of the event to retrieve.
   * @returns {Promise<Event|null>} - The event if found, otherwise null.
   */
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

/**
   * Persists the current event instance to the database.
   * @returns {Promise<void>}
   */
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

   /**
   * Removes the current event instance from the database.
   * @returns {Promise<void>}
   */
  async remove() {
    await Database.db.event.delete({
      where: {
        id: this.id
      }
    });
  }

  /**
   * Retrieves the data of the current event instance.
   * @private
   * @returns {Object} - The event data.
   */
  _eventData() {
    return {
      id: this.id,
      summary: this.summary || null,
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

  /**
   * Associates the current event with a calendar.
   * @private
   * @param {string} eventId - The ID of the event.
   * @returns {Promise<void>}
   */
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
