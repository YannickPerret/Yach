// @ts-check

const Database = require('./database');
const { v4: uuidv4 } = require('uuid');

/**
 * @typedef {Object} EventType
 * @property {string?} [id]
 * @property {string} summary
 * @property {number?} [sequence]
 * @property {string?} [status]
 * @property {string} [transp]
 * @property {string?} [rRule]
 * @property {string} start
 * @property {string} end
 * @property {string} [drStamp]
 * @property {string?} [categories]
 * @property {string?} [location]
 * @property {string?} [geo]
 * @property {string?} [description]
 * @property {string?} [url]
 * @property {string} calendarId
 **/


class Event {
  /**
    * @param {EventType} config
  */
  constructor(config) {
    this.id = config.id || uuidv4(); 
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
    if (!id) return null;

    const event = await Database.getInstance().event.findUnique({
      where: {
        id: id
      }
    });

    if (!event) return null;

    return new Event(event);
}

/**
   * Persists the current event instance to the database.
   * @returns {Promise<void>}
   */
  async persist() {
    try {

      const storedEvent = await Database.getInstance().event.upsert({
        where: {
          id: this.id
        },
        update: this._eventData(),
        create: this._eventData()
      });

      //await this._associateWithCalendar(storedEvent.id);

      if(storedEvent){
        console.log(`Event ${storedEvent.summary} created/updated successfully`);
      }
      else
      {
        throw new Error(`Error in Event ${storedEvent.summary}`);
      }
    }catch(err){
      console.error(err);
    }
  }

   /**
   * Removes the current event instance from the database.
   * @returns {Promise<void>}
   */
  async remove() {
    await Database.getInstance().event.delete({
      where: {
        id: this.id
      }
    });
  }

  /**
   * Retrieves the data of the current event instance.
   * @private
   */
  _eventData() {
    return {
      id: this.id,
      summary: this.summary,
      description: this.description,
      start: this.start,
      end: this.end,
      sequence: 1,
      status: "CONFIRMED",
      transp: this.transp || "OPAQUE",
      drStamp: "ffwsdfsfd",
      categories: "test",
      location: this.location,
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
    const associationExists = await Database.getInstance().calendarEventAssociation.findUnique({
      where: {
        eventId_calendarId: {
          eventId: eventId,
          calendarId: this.calendarId
        }
      }
    });

    if (!associationExists) {
      await Database.getInstance().calendarEventAssociation.create({
        data: {
          eventId: eventId,
          calendarId: this.calendarId
        }
      });
    }
  }
}

module.exports = Event;
