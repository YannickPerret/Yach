// @ts-check

const Database = require("./database");
const { v4: uuidv4 } = require("uuid");

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

  convertToRRule = (recurrence) => {
    this.rRule = "RRULE:";
    const option = recurrence.options;

    if (option === "none") return "";

    let freq;
    let interval;
    let byday = [];
    let bymonthday = [];
    let bymonth = [];

    if (option === "daily") {
      freq = "DAILY";
      interval = recurrence.daily.interval;
      if (recurrence.daily.everyWeekDay) {
        byday = ["MO", "TU", "WE", "TH", "FR"];
      }
    } else if (
      option === "weekly" ||
      option === "workdays" ||
      option === "bi-weekly"
    ) {
      freq = "WEEKLY";
      interval = recurrence.weekly.interval;
      for (let day in recurrence.weekly) {
        if (
          recurrence.weekly[day] &&
          [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ].includes(day)
        ) {
          byday.push(day.substring(0, 2).toUpperCase());
        }
      }
      if (option === "bi-weekly") {
        interval *= 2;
      }
    } else if (option === "monthly") {
      freq = "MONTHLY";
      interval = recurrence.monthly.interval;
      if (recurrence.monthly.byWeekDay) {
        byday.push(recurrence.monthly.weekday);
      }
      if (recurrence.monthly.byMonthDay) {
        bymonthday = recurrence.monthly.monthDays;
      }
      if (recurrence.monthly.monthEndDate) {
        bymonthday.push("-1");
      }
    } else if (option === "yearly") {
      freq = "YEARLY";
      interval = recurrence.yearly.interval;
      if (recurrence.yearly.byYearWeekDay) {
        byday.push(recurrence.yearly.weekday);
      }
      bymonth.push(recurrence.yearly.month);
    } else if (option === "custom") {
      // A compléter
      freq = "CUSTOM";
      interval = recurrence.custom.interval;
    }

    this.rRule += `FREQ=${freq};`;
    if (interval && interval !== 1) this.rRule += `INTERVAL=${interval};`;
    if (byday.length) this.rRule += `BYDAY=${byday.join(",")};`;
    if (bymonthday.length) this.rRule += `BYMONTHDAY=${bymonthday.join(",")};`;
    if (bymonth.length) this.rRule += `BYMONTH=${bymonth.join(",")};`;
  };

  /**
   * Retrieves an event by its ID.
   * @param {string} id - The ID of the event to retrieve.
   * @returns {Promise<Event|null>} - The event if found, otherwise null.
   */
  static async getById(id) {
    if (!id) return null;

    const event = await Database.getInstance().event.findUnique({
      where: {
        id: id,
      },
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
          id: this.id,
        },
        update: this._eventData(),
        create: this._eventData(),
      });

      //await this._associateWithCalendar(storedEvent.id);

      if (storedEvent) {
        console.log(
          `Event ${storedEvent.summary} created/updated successfully`
        );
      }
    } catch (err) {
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
        id: this.id,
      },
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
      rRule: this.rRule,
    };
  }

  /**
   * Associates the current event with a calendar.
   * @private
   * @param {string} eventId - The ID of the event.
   * @returns {Promise<void>}
   */
  async _associateWithCalendar(eventId) {
    const associationExists =
      await Database.getInstance().calendarEventAssociation.findUnique({
        where: {
          eventId_calendarId: {
            eventId: eventId,
            calendarId: this.calendarId,
          },
        },
      });

    if (!associationExists) {
      await Database.getInstance().calendarEventAssociation.create({
        data: {
          eventId: eventId,
          calendarId: this.calendarId,
        },
      });
    }
  }
}

module.exports = Event;
