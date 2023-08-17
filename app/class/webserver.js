// @ts-check

const Fastify = require('fastify');
const view = require('@fastify/view');
const ejs = require('ejs');
const routes = require('./router');
const path = require('path');
const fs = require('fs')
const Calendar = require('./calendar');
const Event = require('./event');
const User = require('./user');

const Ical = require('./adapter/ical');

const fastifyMulter = require('fastify-multer')

const cert = fs.readFileSync(path.join(__dirname, '../certs/cert.pem'));
const key = fs.readFileSync(path.join(__dirname, '../certs/key.pem'));

// Configure multer storage

const storage = fastifyMulter.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './calendars/temps/')
    },
    filename: function (req, file, cb) {
        const originalName = file.originalname;
        const extension = path.extname(originalName);
        const baseName = path.basename(originalName, extension);
        const date = Date.now();
        const newFileName = `${baseName}-${date}${extension}`;
        cb(null, newFileName)
    }
});

const upload = fastifyMulter({ storage: storage })

/**
 * @constructor
 * @typedef {Object} WebserverType
 * @property {number} port
 * @property {string} fileConfig
*/


class Webserver {
    /**
     * @param {WebserverType} config
     */
    constructor(config) {
        this.app = Fastify({ logger: false });
        this.port = config.port;
        this.fileConfig = config.fileConfig;

        this.getHome = this.getHome.bind(this);

        this.initMiddleware();
        this.initRoutes();
        this.start();
    }

    initMiddleware() {
        this.app.register(require('@fastify/static'), {
            root: path.join(__dirname, '../public'),
            prefix: '/',
        });

        this.app.register(view, {
            engine: { ejs },
            root: path.join(__dirname, '../public')
        });

        this.app.register(upload.contentParser);

        this.app.addContentTypeParser('text/calendar', { parseAs: 'string' }, function (req, body, done) {
            try {
                done(null, body) // Here, body will be the raw text/calendar data
            } catch (err) {
                done(err)
            }
        });
    }

    initRoutes() {
        routes(this.app, this, upload);
    }

    async start() {
        try {
            await this.app.listen({
                port: this.port,
                host: '0.0.0.0'
            });
            console.log(`WEB SERVER : Server listening on port ${this.port}`);
        }
        catch (err) {
            this.app.log.error(err);
            process.exit(1);
        }
    }

    // Methodes
    getCalendars(req, res) {

    }

    async getCalendarById(req, res) {
        let id = req.params.id;

        let calendar = await Calendar.getById(id);

        let comp = calendar.generate()

        // set the correct headers
        res.type('Content-Type', 'text/calendar');
        res.status(200).send(comp.toString());
    }

    async propfindCalendar(req, res) {
        let id = req.params.id;

        console.log("PROPFIND request received for calendar:", id);

        // set the correct headers
        res.type('Content-Type', 'text/calendar');
        res.status(207).send();  // 207 Multi-Status is commonly used for PROPFIND responses
    }

    async updateCalendar(req, reply) {
        console.log("Update calendar request received");

        let calendarId = req.params.id;
        let eventData = req.body;

        console.log("Calendar ID:", calendarId);

        // Get the calendar by its id
        const calendar = await Calendar.getById(calendarId);

        if (!calendar) {
            return reply.status(404).send({ error: 'Calendar not found' });
        }

        if (typeof eventData === 'string' && eventData.startsWith("BEGIN:VCALENDAR")) {
            // Handle ICS data
            let jcalData = Ical.parse(eventData);
            let comp = Ical.component(jcalData);

            for (let event of comp.getAllSubcomponents('vevent')) {
                let uid = event.getFirstPropertyValue('uid');
                const existingEvent = await Event.getById(uid);

                if (existingEvent) {
                    existingEvent.summary = event.getFirstPropertyValue('summary');
                    existingEvent.start = event.getFirstPropertyValue('dtstart').toJSDate();
                    existingEvent.end = event.getFirstPropertyValue('dtend').toJSDate();
                    await existingEvent.persist();
                } else {
                    let newEvent = new Event({
                        id: event.getFirstPropertyValue('uid'),
                        start: event.getFirstPropertyValue('dtstart').toJSDate(),
                        end: event.getFirstPropertyValue('dtend').toJSDate(),
                        summary: event.getFirstPropertyValue('summary'),
                        transp: event.getFirstPropertyValue('transp'),
                        calendarId: calendarId
                    });
                    await newEvent.persist();
                    await calendar.addEvent(newEvent);
                }
            }
        } else if (eventData.id && eventData.start && eventData.end && eventData.summary) {
            // Handle JSON data
            const existingEvent = await Event.getById(eventData.id);
            if (existingEvent) {
                existingEvent.summary = eventData.summary;
                existingEvent.start = new Date(eventData.start);
                existingEvent.end = new Date(eventData.end);
                existingEvent.description = eventData.description || null;
                await existingEvent.persist();
            } else {
                // Handle scenario where event doesn't exist yet (if needed)
                let newEvent = new Event({
                    id: eventData.id,
                    start: new Date(eventData.start),
                    end: new Date(eventData.end),
                    summary: eventData.summary,
                    description: eventData.description || null,
                    calendarId: calendarId
                });
                await newEvent.persist();
                await calendar.addEvent(newEvent);
            }
        } else {
            return reply.status(400).send({ message: 'Invalid data format' });
        }

        reply.send({ message: 'Calendar updated successfully' });
    }

    submitCalendar = async (req, reply) => {
        const { file: data, body: { calendars: inputCalendarsSelected, calendarUrl: inputCalendarUrl, type: typeCalendarInput, name: nameCalendarInput, username } } = req;

        const typeCalendar = ["PROFESSIONAL", "PERSONAL", "OTHER"].includes(typeCalendarInput) ? typeCalendarInput : "OTHER";
        const nameCalendar = nameCalendarInput || "Yoda Default";
        let outputCalendar;


        const user = await User.getByUsername(username);
        if (!user) {
            return reply.status(400).send({ error: 'You are not authorized' });
        }

        if (data && inputCalendarUrl) {
            return reply.status(400).send({ error: 'You can\'t upload a file and add a calendar url at the same time' });
        }

        const selectedCalendars = inputCalendarsSelected && Array.isArray(inputCalendarsSelected) ? inputCalendarsSelected : [];

        if (data) {
            outputCalendar = await this.handleFileUpload(data, typeCalendar, nameCalendar, user);
            selectedCalendars.push(outputCalendar.id);
        }

        if (inputCalendarUrl) {
            outputCalendar = await this.handleUrlCalendar(inputCalendarUrl, typeCalendar, nameCalendar, user);
            selectedCalendars.push(outputCalendar.id);
        }

        if (selectedCalendars.length > 1) {
            outputCalendar = await this.handleMultipleCalendars(selectedCalendars, nameCalendar);
        } else if (!data && !inputCalendarUrl) {
            return reply.status(400).send({ error: 'No calendars selected or uploaded' });
        }

        reply.send({ url: `${process.env.ENDPOINT_URL}:${process.env.ENDPOINT_PORT}/api/v1/calendar/${outputCalendar.id}` });
    }

    async handleFileUpload(data, typeCalendar, nameCalendar, user) {
        console.log("File upload request received");
        const filePath = data.path;

        const uploadCalendar = new Calendar({
            source: filePath,
            format: 'ics',
            type: typeCalendar,
            name: nameCalendar,
            visible: "PUBLIC",
            right: "WRITE",
            users: [user]
        });

        await uploadCalendar.persist();
        await uploadCalendar.parseEvents();

        for (const event of uploadCalendar.events) {
            event.calendarId = uploadCalendar.id;
            await event.persist();
        }

        /*Je garde si un jour prisma fonctionne avec les promise.all pour sqlite*/
        /*
        const eventPromises = uploadCalendar.events.map(event => {
            event.calendarId = uploadCalendar.id;
            return event.persist();
        });

        await Promise.all(eventPromises);*/

        fs.unlink(filePath, (err) => {
            if (err) {
                console.error(err);
            }
        });

        return uploadCalendar;
    }

    async handleUrlCalendar(inputCalendarUrl, typeCalendar, nameCalendar, user) {
        const urlCalendar = new Calendar({
            source: inputCalendarUrl,
            format: 'ics',
            type: typeCalendar,
            name: nameCalendar,
            url: inputCalendarUrl,
            visible: "PUBLIC",
            right: "READ",
            users: [user]
        });

        await urlCalendar.persist();
        urlCalendar.addToTaskScheduler();
        await urlCalendar.parseEvents();

        for (const event of urlCalendar.events) {
            event.calendarId = urlCalendar.id;
            await event.persist();
        }
        
        return urlCalendar;
    }

    async handleMultipleCalendars(selectedCalendars, nameCalendar) {
        let updateParentCalendar = false;

        const ParentCalendar = new Calendar({
            name: nameCalendar,
            type: "SHARED",
            visible: "PUBLIC",
        });
    
        await ParentCalendar.persist();
    
        for (const selectedCalendar of selectedCalendars) {
            const calendar = await Calendar.getById(selectedCalendar);
            if (calendar.url !== null) {
                ParentCalendar.right = "READ";
                updateParentCalendar = true;
            }
            calendar.parentCalendarId = ParentCalendar.id;
            await calendar.persist();
        }

        if (updateParentCalendar) {
            await ParentCalendar.persist();
        }

        return ParentCalendar;
    }

    async removeCalendar(req, reply) {
        const id = req.params.id

        let calendar = await Calendar.getById(id)
        if (calendar) {
            calendar.remove();
        }
    }

    /* WEB INTERFACE */

    async getHome(req, reply) {
        let calendars = await Calendar.getAll();
        return reply.status(200).view('index.ejs', {
            title: 'Home Page',
            calendars: calendars,
        });
    }

    async getUserCalendars(req, reply) {
        let username = req.params.id;
        let user = await User.getByUsername(username);
        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }

        let calendars = await user.getCalendars();

        return reply.status(200).view('calendar.ejs', {
            title: 'Calendars Page',
            calendars: calendars,
            user: user,
        });
    }

    async getUserCalendarById(req, reply) {
        let username = req.params.id;
        let calendarId = req.params.calendarId;

        let user = await User.getByUsername(username);
        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }

        let calendar = await Calendar.getById(calendarId);
        if (!calendar) {
            return reply.status(404).send({ error: 'Calendar not found' });
        }

        let calendars = await user.getCalendarWithEvents();

        return reply.status(200).view('calendar.ejs', {
            title: 'Calendar Page',
            calendars: calendars[0],
            user: user,
        });
    }

    async getUserCalendarEvents(req, reply) {
        let id = req.params.id;
        let calendarId = req.params.calendarId;
        let calendar = []

        if (id) {
            calendar = await Calendar.getById(calendarId);
            if (!calendar) {
                return reply.status(404).send({ error: 'Calendar not found' });
            }
        }

        return reply.status(200).view('events.ejs', {
            title: 'Events Page',
            calendar: calendar,
        });
    }

    async getUserCalendarEventById(req, reply) {
        let id = req.params.id;
        let calendarId = req.params.calendarId;
        let eventId = req.params.eventId;
        let calendar = []

        if (id) {
            calendar = await Calendar.getById(calendarId);
            if (!calendar) {
                return reply.status(404).send({ error: 'Calendar not found' });
            }
        }
        let event = await Event.getById(eventId);
        if (!event) {
            return reply.status(404).send({ error: 'Event not found' });
        }
        return reply.status(200).view('event.ejs', {
            title: 'Event Page',
            event: event,
        });
    }

    async getWebCalendarById(req, reply) {
        let id = req.params.id;
        let calendar = []
        if (id) {
            calendar = await Calendar.getById(id);

            if (!calendar) {
                return reply.status(404).send({ error: 'Calendar not found' });
            }
        }

        return reply.status(200).view('calendar.ejs', {
            title: 'Calendar Page',
            calendar: calendar,
        });
    }
}

module.exports = Webserver;