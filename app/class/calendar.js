// @ts-check

const Ical = require('./adapter/ical');
const Event = require('./event');
const Database = require('./database');
const { v4: uuidv4 } = require('uuid');
const SourceHandler = require('./handler/sourceHandler');
const TaskScheduler = require('./taskScheduler');
const User = require('./user');

/**
 * Represents a calendar.
 * @typedef {Object} CalendarType
 * @property {string} id
 * @property {string?} [name]
 * @property {string} type
 * @property {string?} [url]
 * @property {string} [class]
 * @property {string?} [color]
 * @property {string} [right]
 * @property {User[]} [users]
 * @property {string?} [syncExpressionCron]
 * @property {string?} [parentCalendarId]
 * @property {string?} [source]
 * property {string} [format]
 * @property {Event[]} [events]
 * 
 */

class Calendar {
    /**
        * @param {CalendarType} config
    */
    constructor(config) {
        this.id = config.id || uuidv4();
        this.source = new SourceHandler({ source: config.source });
        this.outputCalendar = Ical.component(['vcalendar', [], []]);
        this.events = config.events || [];
        this.name = config.name;
        this.type = config.type;
        this.url = config.url;
        this.class = config.class;
        this.right = config.right;
        this.users = config.users || [];
        this.syncExpressionCron = config.syncExpressionCron || '0 0 * * *';
        this.parentCalendarId = config.parentCalendarId;
    }

    /**
         * Parse events from the source.
         * @returns {Promise<void>}
     */
    parseEvents = async () => {
        try {
            if (this.source == null) throw new Error('No source file specified')

            this.events = await this.source.parseData();

        } catch (error) {
            console.error(error);
            this.events = [];
        }
    }

    /**
     * Generates an iCal string from the events.
     * @returns {string} - The iCal formatted string.
     */
    generate = () => {
        this.events.forEach((event) => {
            let vevent = Ical.component('vevent');
            vevent.updatePropertyWithValue('uid', event.id);
            vevent.updatePropertyWithValue('dtstart', event.start);
            vevent.updatePropertyWithValue('dtend', event.end);

            vevent.updatePropertyWithValue('summary', event.summary);

            this.outputCalendar.addSubcomponent(vevent);
        });
        return this.outputCalendar.toString();
    }

    async getUsers() {
        const users = await Database.db.user.findMany({
            where: {
                calendars: {
                    some: {
                        id: this.id
                    }
                }
            }
        });

        return users;
    }

    /**
     * Add a child calendar.
     * @param {Calendar} calendar - Calendar instance to be added as child.
     * @returns {Promise<void>}
     */
    async addChildCalendar(calendar) {
        calendar.parentCalendarId = this.id;
        await calendar.persist();
    }

    /**
     * Get child calendars.
     * @returns {Promise<Calendar[]>} - List of child calendars.
     */
    async getChildCalendars() {
        const childCalendars = await Calendar.getAll({ parentCalendarId: this.id });
        if (!childCalendars) {
            return [];
        }
        return childCalendars;
    }

    /**
     * Persist the calendar data to the database.
     * @returns {Promise<void>}
     */
    async persist() {
        await Database.db.calendar.upsert({
            where: {
                id: this.id
            },
            update: {
                name: this.name,
                type: this.type,
                url: this.url,
                right: this.right,
                syncExpressionCron: this.syncExpressionCron,
                parentCalendarId: this.parentCalendarId,
            },
            create: {
                id: this.id,
                name: this.name,
                type: this.type,
                url: this.url,
                right: this.right,
                syncExpressionCron: this.syncExpressionCron,
                parentCalendarId: this.parentCalendarId,
            }
        });

        console.log("Calendar persisted with id:", this.id);

        for (let user of this.users) {
            await this.#associateUserWithCalendar(user.id);
        }
    }

    /**
     * Add an event to the calendar.
     * @param {Event} event - Event instance to be added.
     * @returns {Promise<void>}
     */
    async addEvent(event) {
        if (this.type === "SHARED") {
            const childCalendars = await this.getChildCalendars();
            for (const childCalendar of childCalendars) {
                await childCalendar.#associateEventWithCalendar(event.id);
            }
        } else {
            await this.#associateEventWithCalendar(event.id);
        }
    }

    /**
     * Get events associated with the calendar.
     * @returns {Promise<Event[]>} - List of events.
     */
    async getEvents() {
        try {
            const events = await Database.db.calendarEventAssociation.findMany({
                where: {
                    calendarId: this.id
                },
                include: {
                    event: true
                },
                distinct: ['eventId'],
            });

            //get only events.event
            return events.map(event => new Event(event.event));
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    /**
     * Update events in the calendar.
     * @returns {Promise<void>}
     */
    async updateEvents() {
        for (let event of this.events) {
            await Database.db.event.delete({
                where: {
                    id: event.id
                }
            });
        }

        for (let event of this.events) {
            await event.persist();
        }

        console.log("Events updated for calendar with id:", this.id);
    }

    /**
     * Get a calendar instance by its ID.
     * @param {string} id - Unique identifier of the calendar.
     * @returns {Promise<Calendar>} - Calendar instance or null if not found.
     */
    static async getById(id) {
        try {
            const calendarData = await Database.db.calendar.findUnique({
                where: { id },
                include: {
                    CalendarEventAssociations: {
                        include: {
                            event: true
                        }
                    },
                    subCalendars: true
                }
            });

            if (!calendarData) {
                throw new Error(`Calendar with id ${id} not found.`);
            }

            const { CalendarEventAssociations, ...otherCalendarData } = calendarData;
            // Convert associated events into Event instances
            const events = calendarData.CalendarEventAssociations.map(association => new Event(association.event));

            const calendar = new Calendar({ ...otherCalendarData, events });


            // Get child calendars and their events if any.
            const childCalendars = await calendar.getChildCalendars();
            for (const childCalendar of childCalendars) {
                const childEvents = await childCalendar.getEvents();
                childEvents.forEach(event => event.calendarId = childCalendar.id);
                calendar.events.push(...childEvents);
            }

            calendar.events = calendar.events.filter((event, index, self) => self.findIndex(e => e.id === event.id) === index);

            return calendar;
        } catch (error) {
            console.error("Error fetching calendar by ID:", error);
            throw error;
        }
    }

    /**
     * Gets calendars by a specified field and value.
     * @param {string} field - The field name.
     * @param {any} value - The field value.
     * @returns {Promise<Calendar[]>} - An array of Calendar instances.
     */
    static async getBy(field, value) {
        try {
            let filter = {};
            if (String(value).toLocaleLowerCase() === "is not null") {
                filter[field] = {
                    not: null
                };
            } else {
                filter[field] = String(value).toLocaleLowerCase();
            }

            const calendarsData = await Database.db.calendar.findMany({
                where: filter
            });

            return calendarsData.map(data => new Calendar(data));
        } catch (error) {
            console.error(`Error fetching calendars by ${field} = ${value}:`, error);
            throw error;
        }
    }



    /**
     * Get all calendars optionally filtered by a given criteria.
     * @param {Object|null} filter - Filtering criteria.
     * @returns {Promise<Calendar[]>} - List of calendars.
     */
    static async getAll(filter = null) {
        try {
            let calendarsData
            if (filter != null) {
                calendarsData = await Database.db.calendar.findMany({
                    where: {
                        ...filter
                    },
                });
            }
            else {
                calendarsData = await Database.db.calendar.findMany();
            }

            let calendars = calendarsData.map(calendarData => new Calendar(calendarData));

            return calendars;
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    /**
     * Remove a calendar by its ID.
     * @param {string} id - Unique identifier of the calendar.
     * @returns {Promise<void>}
     */
    static async removeById(id) {
        try {
            await Database.db.calendar.delete({
                where: {
                    id
                }
            });
        } catch (error) {
            console.error(error);
        }
    }

    async remove() {
        try {
            if (this.type !== "SHARED") {
                const associatedEvents = await Database.db.calendarEventAssociation.findMany({
                    where: {
                        calendarId: this.id
                    },
                    select: {
                        eventId: true
                    }
                });

                for (let { eventId } of associatedEvents) {
                    await Database.db.event.delete({
                        where: {
                            id: eventId
                        }
                    });
                }
            }

            await Database.db.calendar.delete({
                where: {
                    id: this.id
                }
            });
        } catch (e) {
            console.debug(e);
        }
    }


    // add to task scheduler to sync
    addToTaskScheduler() {
        const taskSchedulerManager = TaskScheduler.getInstance();
        taskSchedulerManager.addTask(this.syncExpressionCron, this.sync, { name: `Sync ${this.name}` });
    }

    /**
     * Sync the calendar with its source.
     * @returns {Promise<void>}
     */
    sync = async () => {
        if (!this.url) {
            throw new Error('This calendar does not have a URL to sync from.');
        }

        const currentEvents = await this.getEvents();

        this.source = new SourceHandler({ source: this.url });
        await this.parseEvents();
        const newEvents = this.events;

        const eventsToUpsert = [];
        const eventsToDelete = currentEvents.slice();

        for (const newEvent of newEvents) {
            const matchingEvent = currentEvents.find(event => event.id === newEvent.id);
            if (!matchingEvent || JSON.stringify(newEvent) !== JSON.stringify(matchingEvent)) {
                eventsToUpsert.push(newEvent);
            }

            if (matchingEvent) {
                const index = eventsToDelete.indexOf(matchingEvent);
                if (index > -1) {
                    eventsToDelete.splice(index, 1);
                }
            }
        }

        for (const event of eventsToUpsert) {

            event.calendarId = this.id;
            await event.persist();
            await this.#associateEventWithCalendar(event.id);
        }

        for (const event of eventsToDelete) {
            await event.remove();
        }

        console.log("Synced calendar with id:", this.id);
    }
    // PRIVATE METHOD

    /**
     * Associate an event with the calendar.
     * @param {string} eventId - Unique identifier of the event.
     * @returns {Promise<void>}
     */
    async #associateEventWithCalendar(eventId) {
        const associationExists = await Database.db.calendarEventAssociation.findUnique({
            where: {
                eventId_calendarId: {
                    eventId: eventId,
                    calendarId: this.id
                }
            }
        });

        if (!associationExists) {
            await Database.db.calendarEventAssociation.create({
                data: {
                    eventId: eventId,
                    calendarId: this.id
                }
            });
        }
    }

    async #associateUserWithCalendar(userId) {
        const associationExists = await Database.db.CalendarUserAssociation.findUnique({
            where: {
                userId_calendarId: {
                    userId: userId,
                    calendarId: this.id
                }
            }
        });

        if (!associationExists) {
            await Database.db.CalendarUserAssociation.create({
                data: {
                    userId: userId,
                    calendarId: this.id
                }
            });
        }
    }
}

module.exports = Calendar;
