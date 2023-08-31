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
 * @property {Event[]} [events]
 * @property {Calendar[]} [children]
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
        this.color = config.color;
        this.right = config.right;
        this.users = config.users || [];
        this.syncExpressionCron = config.syncExpressionCron || '0 0 * * *';
        this.parentCalendarId = config.parentCalendarId;
        this.children = [];
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

    filterDuplicateEvents = (calendar) => {
        const collectAllEvents = (calendar) => {
            let allEvents = [...calendar.events];
            if (calendar.children) {
                for (const child of calendar.children) {
                    allEvents = allEvents.concat(collectAllEvents(child));
                }
            }
            return allEvents;
        };

        const allEvents = collectAllEvents(calendar);

        const uniqueEvents = allEvents.filter((event, index, self) => self.findIndex(e => e.id === event.id) === index);

        calendar.events = uniqueEvents;

        if (calendar.children) {
            for (const child of calendar.children) {
                child.events = [];
            }
        }
    };

    updateChildrenCalendars = async (calendarUpdated) => {
        const currentChildIds = this.children.map(child => child.id);
        const updatedChildIds = calendarUpdated.childrens;

        if (currentChildIds.sort().toString() !== updatedChildIds.sort().toString()) {
            for (const childId of updatedChildIds) {
                if (!currentChildIds.includes(childId)) {
                    const childCalendar = (await Calendar.getById(childId))[0];
                    if (childCalendar) {
                        await this.addChildCalendar(childCalendar);
                    }
                }
            }

            for (const childId of currentChildIds) {
                if (!updatedChildIds.includes(childId)) {
                    const childCalendar = (await Calendar.getById(childId))[0];
                    if (childCalendar) {
                        await this.removeParentCalendar(childCalendar);
                    }
                }
            }
        }
    };

    /**
     * Generates an iCal string from the events.
     * @returns {string} - The iCal formatted string.
     */
    generateIcal = () => {
        const addEventsToIcal = (events) => {
            events.forEach((event) => {
                let vevent = Ical.component('vevent');
                vevent.updatePropertyWithValue('uid', event.id);
                vevent.updatePropertyWithValue('dtstart', event.start);
                vevent.updatePropertyWithValue('dtend', event.end);
                vevent.updatePropertyWithValue('summary', event.summary);
                this.outputCalendar.addSubcomponent(vevent);
            });
        };

        addEventsToIcal(this.events);

        if (this.children && this.children.length > 0) {
            this.children.forEach((childCalendar) => {
                addEventsToIcal(childCalendar.events);
            });
        }

        return this.outputCalendar.toString();
    };

    updateTaskScheduler = async (calendarUpdated) => {
        const taskSchedulerManager = TaskScheduler.getInstance();
        const currentCron = this.syncExpressionCron;
        const updatedCron = calendarUpdated.syncExpressionCron;

        if (currentCron !== updatedCron) {
            console.log(`Cron - Calendar ${this.name} updated`)
            taskSchedulerManager.updateTask(`Sync ${this.name}`, updatedCron, this.sync);
        } else {
            taskSchedulerManager.addTask(updatedCron, this.sync, { name: `Sync ${this.name}` });
        }
    };

    /**
     * Add a child calendar.
     * @param {Calendar} calendar - Calendar instance to be added as child.
     * @returns {Promise<void>}
     */
    async addChildCalendar(calendar) {
        await Database.getInstance().CalendarAssociation.create({
            data: {
                parentCalendarId: this.id,
                childCalendarId: calendar.id
            }
        });
    }

    /**
     * Get child calendars.
     * @returns {Promise<Calendar[]>} - List of child calendars.
     */
    async getChildCalendars() {
        const childCalendars = await Database.getInstance().CalendarAssociation.findMany({
            where: {
                parentCalendarId: this.id
            },
            include: {
                childCalendar: true
            }
        });

        return childCalendars ? childCalendars.map(childCalendar => new Calendar(childCalendar.childCalendar)) : [];
    }


    /**
     * Persist the calendar data to the database.
     * @returns {Promise<void>}
     */
    async persist() {
        await Database.getInstance().calendar.upsert({
            where: {
                id: this.id
            },
            update: {
                name: this.name,
                type: this.type,
                url: this.url,
                right: this.right,
                color: this.color,
                class: this.class,
                syncExpressionCron: this.syncExpressionCron,
            },
            create: {
                id: this.id,
                name: this.name,
                type: this.type,
                url: this.url,
                right: this.right,
                syncExpressionCron: this.syncExpressionCron,
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
        try {

            await event.persist();

            if (this.type !== "SHARED") {
                await this.#associateEventWithCalendar(event.id);
            }

            const childCalendars = await this.getChildCalendars();
            if (childCalendars && childCalendars.length > 0) {
                for (const childCalendar of childCalendars) {
                    await childCalendar.addEvent(event);
                }
            }
            console.log(`Event ${event.summary} added to calendar ${this.name}`);
        } catch (error) {
            console.error(`Error adding event to calendar with id: ${this.id}`, error);
            throw error;
        }
    }

    /**
     * Get events associated with the calendar.
     * @returns {Promise<Event[]>} - List of events.
     */
    async getEvents() {
        try {
            const events = await Database.getInstance().calendarEventAssociation.findMany({
                where: {
                    calendarId: this.id
                },
                include: {
                    event: true
                },
                distinct: ['eventId'],
            });

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
            await Database.getInstance().event.delete({
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

    mergeEventsCalendar = async (eventsToMerge) => {
        const events = await this.getEvents();
        const eventsToUpsert = [];
        const eventsToDelete = events.slice();

        for (const newEvent of eventsToMerge) {
            const matchingEvent = events.find(event => event.id === newEvent.id);
            if (!matchingEvent || JSON.stringify(newEvent) !== JSON.stringify(matchingEvent)) {
                eventsToUpsert.push(newEvent);
            }

            /*if (matchingEvent) {
                const index = eventsToDelete.indexOf(matchingEvent);
                if (index > -1) {
                    eventsToDelete.splice(index, 1);
                }
            }*/
        }

        for (const event of eventsToUpsert) {
            event.calendarId = this.id;
            await event.persist();
            await this.#associateEventWithCalendar(event.id);
        }

        /*for (const event of eventsToDelete) {
            await event.remove();
        }*/

        console.log("Events merged for calendar with id:", this.id);
    }
    /**
     * Get a calendar instance by its ID.
     * @param {string} id - Unique identifier of the calendar.
     * @returns {Promise<[Calendar]>} - Calendar instance or null if not found.
     */
    static async getById(id) {
        try {
            const calendarData = await Database.getInstance().calendar.findUnique({
                where: { id },
                include: {
                    calendarEventAssociations: {
                        include: {
                            event: true
                        }
                    },
                    childCalendars: true,
                },
            });

            if (!calendarData) {
                return [];
            }

            const { calendarEventAssociations, childCalendars, ...ParentCalendarData } = calendarData;
            const events = calendarEventAssociations.map(association => new Event(association.event));

            const calendar = new Calendar({ ...ParentCalendarData, events });

            await this.getChildCalendarsWithEvents(calendar, childCalendars);

            //calendar.filterDuplicateEvents(calendar);

            return [calendar];
        } catch (error) {
            console.error("Error fetching calendar by ID:", error);
            throw error;
        }
    }


    static async getChildCalendarsWithEvents(parentCalendar, childAssociations) {
        for (const association of childAssociations) {
            const childCalendarData = await Database.getInstance().calendar.findUnique({
                where: { id: association.childCalendarId },
                include: {
                    calendarEventAssociations: {
                        include: {
                            event: true
                        }
                    },
                    childCalendars: true,
                    calendarUsersAssociations: {
                        include: {
                            user: true
                        }
                    }
                },
            });

            const { calendarEventAssociations, childCalendars, calendarUsersAssociations, ...otherChildCalendarData } = childCalendarData;
            const childEvents = calendarEventAssociations.map(association => new Event(association.event));
            const childUsers = calendarUsersAssociations.map(association => association.user);

            const childCalendar = new Calendar({ ...otherChildCalendarData, events: childEvents, users: childUsers });

            parentCalendar.children.push(childCalendar);

            await this.getChildCalendarsWithEvents(childCalendar, childCalendars);
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

            const calendarsData = await Database.getInstance().calendar.findMany({
                where: filter
            });

            return calendarsData.map(data => new Calendar(data));
        } catch (error) {
            console.error(`Error fetching calendars by ${field} = ${value}:`, error);
            throw error;
        }
    }

    async addParentCalendar(parentCalendar) {
        await Database.getInstance().CalendarAssociation.upsert({
            where: {
                parentCalendarId_childCalendarId: {
                    parentCalendarId: parentCalendar.id,
                    childCalendarId: this.id
                }
            },
            update: {},
            create: {
                parentCalendarId: parentCalendar.id,
                childCalendarId: this.id
            }
        });
    }

    async removeParentCalendar(parentCalendar) {
        await Database.getInstance().CalendarAssociation.delete({
            where: {
                parentCalendarId_childCalendarId: {
                    parentCalendarId: this.id,
                    childCalendarId: parentCalendar.id
                }
            }
        });
    }


    async getParentCalendars() {
        const parentCalendars = await Database.getInstance().CalendarAssociation.findMany({
            where: {
                childCalendarId: this.id
            },
            include: {
                parentCalendar: true
            }
        });

        return parentCalendars ? parentCalendars.map(association => association.parentCalendar) : [];
    }


    /**
     * Get all calendars optionally filtered by a given criteria.
     * @param {Object|null} filter - Filtering criteria.
     * @returns {Promise<Calendar[]>} - List of calendars.
     */
    static async getAll(filter = null) {
        try {
            let calendarsData;
            if (filter != null) {
                calendarsData = await Database.getInstance().calendar.findMany({
                    where: {
                        ...filter
                    },
                });
            }
            else {
                calendarsData = await Database.getInstance().calendar.findMany();
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
            await Database.getInstance().calendar.delete({
                where: {
                    id
                }
            });
        } catch (error) {
            console.error(error);
        }
    }

    /* rework delete function */
    async remove() {
        try {
            // Suppression des associations pour les calendriers partagés
            if (this.type === 'SHARED') {
                await Database.getInstance().calendarEventAssociation.deleteMany({
                    where: { calendarId: this.id }
                });
            } else {
                // Trouver les IDs des événements associés à ce calendrier
                const eventIds = await Database.getInstance().calendarEventAssociation.findMany({
                    where: { calendarId: this.id },
                    select: { eventId: true }
                }).then(events => events.map(e => e.eventId));

                console.log("Events to delete:", eventIds);

                // Supprimer les associations d'événement avant de supprimer les événements eux-mêmes
                await Database.getInstance().calendarEventAssociation.deleteMany({
                    where: { eventId: { in: eventIds } }
                });

                // Suppression des événements eux-mêmes
                await Database.getInstance().event.deleteMany({
                    where: { id: { in: eventIds } }
                });
            }

            // Suppression des associations de calendrier
            await Database.getInstance().calendarAssociation.deleteMany({
                where: { OR: [{ parentCalendarId: this.id }, { childCalendarId: this.id }] }
            });

            // Suppression des associations d'utilisateur de calendrier
            await Database.getInstance().calendarUserAssociation.deleteMany({
                where: { calendarId: this.id }
            });

            // Suppression du calendrier lui-même
            await Database.getInstance().calendar.delete({
                where: { id: this.id }
            });

            console.log("Calendar removed with id:", this.id);

            // Suppression de l'objet (facultatif et dépend de votre logique d'application)
            delete this;

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
        const associationExists = await Database.getInstance().calendarEventAssociation.findUnique({
            where: {
                eventId_calendarId: {
                    eventId: eventId,
                    calendarId: this.id
                }
            }
        });

        if (!associationExists) {
            await Database.getInstance().calendarEventAssociation.create({
                data: {
                    eventId: eventId,
                    calendarId: this.id
                }
            });
        }
    }

    async #associateUserWithCalendar(userId) {
        const associationExists = await Database.getInstance().CalendarUserAssociation.findUnique({
            where: {
                userId_calendarId: {
                    userId: userId,
                    calendarId: this.id
                }
            }
        });

        if (!associationExists) {
            await Database.getInstance().CalendarUserAssociation.create({
                data: {
                    userId: userId,
                    calendarId: this.id
                }
            });
        }
    }
}

module.exports = Calendar;
