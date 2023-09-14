// @ts-check

const Fastify = require('fastify');
const cors = require('@fastify/cors')
const routes = require('./router');
const path = require('path');
const fs = require('fs')
const Calendar = require('./calendar');
const Event = require('./event');
const User = require('./user');
const Auth = require('./auth');

const Ical = require('./adapter/ical');

const fastifyMulter = require('fastify-multer');
const Task = require('./task');

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

        this.getLogin = this.getLogin.bind(this);

        this.initMiddleware();
        this.initRoutes();
        this.start();
    }

    async initMiddleware() {
        // cors register with costum origin
        this.app.register(cors, {
            origin: '*',
            methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
        })

        //await this.app.register(cors, { origin: true, credentials: true });

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

    async getAllCalendars(req, reply) {
        let calendars = await Calendar.getAll();

        reply.send(calendars);
    }

    async getCalendarById(req, res) {
        let id = req.params.id;

        let calendar = (await Calendar.getById(id))[0];

        let comp = calendar.generateIcal()

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

    getTemporaryCalendar = async (req, reply) => {
        console.log("Temporary calendar request received");

        const urlCalendarTemporary = req.body.url;

        if (!urlCalendarTemporary) {
            return reply.status(400).send({ error: 'No url provided' });
        }

        let TemporaryCalendar = new Calendar({
            source: urlCalendarTemporary,
            type: "OTHER",
            name: "Yoda Temporary Default",
            class: "PUBLIC",
            right: "WRITE"
        });

        await TemporaryCalendar.parseEvents();

        reply.status(200).send(TemporaryCalendar);
    }

    /** UPDATE EVENT IN CALENDAR  **/
    updateEventCalendar = async (req, reply) => {

        let calendarId = req.params.id;
        let eventData = req.body;
        let eventToPersist
        console.log("Update calendar request received");
        console.log("Calendar ID:", calendarId);


        // Get the calendar by its id
        const calendar = await Calendar.getById(calendarId);

        if (!calendar[0]) {
            return reply.status(404).send({ error: 'Calendar not found' });
        }
        if (calendar[0].right === "READ") {
            console.debug("Calendar is read only");
            return reply.status(403).send({ error: 'You don\'t have the right to update this calendar' });
        }



        if (typeof eventData === 'string' && eventData.startsWith("BEGIN:VCALENDAR")) {
            // Handle ICS data  
            let jcalData = Ical.parse(eventData);
            let comp = Ical.component(jcalData);

            for (let event of comp.getAllSubcomponents('vevent')) {
                let uid = event.getFirstPropertyValue('uid');

                eventToPersist = await Event.getById(uid);

                if (eventToPersist) {
                    eventToPersist.summary = event.getFirstPropertyValue('summary');
                    eventToPersist.start = event.getFirstPropertyValue('dtstart');
                    eventToPersist.end = event.getFirstPropertyValue('dtend');
                    eventToPersist.rRule = event.getFirstPropertyValue('rrule');
                    await eventToPersist.persist();
                } else {
                    eventToPersist = new Event({
                        id: event.getFirstPropertyValue('uid'),
                        start: event.getFirstPropertyValue('dtstart'),
                        end: event.getFirstPropertyValue('dtend'),
                        summary: event.getFirstPropertyValue('summary'),
                        transp: event.getFirstPropertyValue('transp'),
                        rRule: event.getFirstPropertyValue('rrule'),
                        calendarId: calendarId
                    });
                    await calendar[0].addEvent(eventToPersist);
                }
            }
        } else if (typeof eventData === 'object') {
            eventToPersist = await Event.getById(eventData.eventId);


            if (eventToPersist) {
                eventToPersist.summary = eventData.summary;
                eventToPersist.start = new Date(eventData.startDate).toISOString();
                eventToPersist.end = new Date(eventData.endDate).toISOString();
                eventToPersist.description = eventData.description || null;
                eventToPersist.location = eventData.location || null;
                eventToPersist.transp = eventData.transp || null;
                eventToPersist.rRule = eventData.recurrence || null;
                //eventToPersist.convertToRRule(eventData.recurrence);

                await eventToPersist.persist();

            } else {
                eventToPersist = new Event({
                    start: new Date(eventData.startDate).toISOString(),
                    end: new Date(eventData.endDate).toISOString(),
                    summary: eventData.summary,
                    description: eventData.description || '',
                    location: eventData.location || '',
                    rRule: eventData.recurrence || null,
                    calendarId: calendarId
                });
                //eventToPersist.convertToRRule(eventData.recurrence);
                
                if (calendar[0].type === 'SHARED' && eventData.selectedCalendar?.length > 0) {
                    for (const childCalendar of calendar[0].children) {
                        if (eventData.selectedCalendar.includes(childCalendar.id)) {
                            await childCalendar.addEvent(eventToPersist);
                        }
                        else
                            console.log("Skipping event addition for non-selected shared calendar");
                    }
                } else {
                    await calendar[0].addEvent(eventToPersist);
                }
            }
        } else {
            return reply.status(400).send({ error: 'Invalid data format' });
        }

        return reply.status(200).send({ message: 'Calendar updated successfully' });

    }

    submitCalendar = async (req, reply) => {
        console.log("Submit calendar request received")
        const { file: data, body: { calendars: inputCalendarsSelected, calendarUrl: inputCalendarUrl, classification: classification, name: nameCalendarInput, class: class_visiblity, username } } = req;

        const classificationCalendar = ["PROFESSIONAL", "PERSONAL", "OTHER"].includes(classification) ? classification : "OTHER";
        const classVisibility = ["PUBLIC", "PRIVATE"].includes(class_visiblity) ? class_visiblity : "PUBLIC";
        const nameCalendar = req.body.nameCalendarInput || "Yoda Default";
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
            console.log(data)
            outputCalendar = await this.handleFileUpload(data, classificationCalendar, nameCalendar, classVisibility, user);
            selectedCalendars.push(outputCalendar.id);
        }

        if (inputCalendarUrl) {
            outputCalendar = await this.handleUrlCalendar(inputCalendarUrl, classificationCalendar, nameCalendar, classVisibility, user);
            selectedCalendars.push(outputCalendar.id);
        }

        if (selectedCalendars.length > 1) {
            outputCalendar = await this.handleMultipleCalendars(selectedCalendars, classificationCalendar, nameCalendar, classVisibility, user);
        } else if (!data && !inputCalendarUrl) {
            return reply.status(400).send({ error: 'More than one calendar must be selected' });
        }

        reply.status(200).send({calendar: outputCalendar});
    }

    // à déplacer dans la class Calendar
    async handleFileUpload(data, classificationCalendar, nameCalendar, classVisibility, user) {
        console.log("File upload request received");
        const filePath = data.path;

        const uploadCalendar = new Calendar({
            source: filePath,
            classification: classificationCalendar,
            name: nameCalendar,
            class: classVisibility,
            right: "WRITE",
            users: [user]
        });

        await uploadCalendar.persist();
        await uploadCalendar.parseEvents();

        for (const event of uploadCalendar.events) {
            event.calendarId = uploadCalendar.id;
            await event.persist();
            await uploadCalendar.addEvent(event);
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

    async handleUrlCalendar(inputCalendarUrl, classificationCalendar, nameCalendar, classVisibility, user) {
        const urlCalendar = new Calendar({
            source: inputCalendarUrl,
            classification: classificationCalendar,
            name: nameCalendar,
            url: inputCalendarUrl,
            class: classVisibility,
            right: "READ",
            users: [user]
        });

        await urlCalendar.persist();
        urlCalendar.addToTaskScheduler();
        await urlCalendar.parseEvents();

        for (const event of urlCalendar.events) {
            event.calendarId = urlCalendar.id;
            await event.persist();
            await urlCalendar.addEvent(event);
        }

        return urlCalendar;
    }

    async handleMultipleCalendars(selectedCalendars, classificationCalendar, nameCalendar, classVisibility, user) {
        let updateParentCalendar = false;

        const ParentCalendar = new Calendar({
            name: nameCalendar,
            type: "SHARED",
            classification: classificationCalendar,
            class: classVisibility,
            users: [user]
        });

        await ParentCalendar.persist();

        for (const selectedCalendar of selectedCalendars) {
            const calendar = await Calendar.getById(selectedCalendar);
            if (calendar[0].url !== null) {
                ParentCalendar.right = "READ";
                updateParentCalendar = true;
            }
            await calendar[0].addParentCalendar(ParentCalendar);
            await calendar[0].persist();
        }

        if (updateParentCalendar) {
            await ParentCalendar.persist();
        }

        return ParentCalendar;
    }
    ////////////

    async removeCalendar(req, reply) {
        const id = req.params.id

        let calendar = (await Calendar.getById(id))[0];
        if (calendar) {
            calendar.remove();
        }
    }

    /**** AUTHENTIFICATION *******/

    async login(req, reply) {
        const { username, password } = req.body;

        const token = await Auth.login(username, password);

        if (!token) {
            return reply.status(400).send({ error: 'Username or password incorrect' });
        }

        reply.header('Authorization', `Bearer ${token}`);

        return { token, username, redirectUrl: `/users/${username}/calendars` };
    }

    async logout(req, reply) {
        const token = req.headers.authorization.split(' ')[1];
        if (!token) {
            return reply.status(400).send({ error: 'You are not connected' });
        }

        await Auth.logout(token);
        return reply.status(200).view('logout.ejs',
            { title: 'disconnect', error: 'You are now disconnected', token: null });
    }

    /****** WEB INTERFACE ********/

    async getLogin(req, reply) {
        return reply.status(200).view('index.ejs', {
            title: 'Yach - Se connecter',
        });
    }

    async getLogout(req, reply) {
        return reply.status(200).view('logout.ejs', {
            title: 'Disconnect page',
        })
    }

    async getDashboard(req, reply) {
        let calendars = await Calendar.getAll();
        return reply.status(200).view('dashboard.ejs', {
            title: 'Dashboard Calendrier',
            calendars: calendars,
        });
    }

    async getUsers(req, reply) {
        let users = await User.getAll();
        return reply.status(200).send({ users: users });
    }

    async getUserCalendars(req, reply) {
        let username = req.params.id;
        let user = await User.getByUsername(username);

        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }

        let calendars = await user.getCalendarWithEvents();

        return reply.status(200).send({
            title: 'Calendars Page',
            calendars: calendars,
            user: user,
        });
    }

    async getUserCalendarById(req, reply) {
        let username = req.params.id;
        let calendarId = req.params.calendarId;

        let user = await User.getByUsername(username);

        if (!user || !calendarId) {
            return reply.status(200).view('calendar.ejs', {
                title: 'Calendar Page',
                calendars: [],
                user: []
            });
        }

        let calendar = await Calendar.getById(calendarId)

        if (!calendar) {
            return reply.status(404).send({ error: 'Calendar not found' });
        }

        return reply.status(200).view('calendar.ejs', {
            title: 'Calendar Page',
            calendars: calendar,
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

            if (calendar[0].class === "PRIVATE") {
                return reply.status(403).send({
                    title: 'Calendar Page',
                    calendars: [],
                    user: [],
                    error: 'This calendar is private'
                });
            }
        }

        return reply.status(200).view('calendar.ejs', {
            title: 'Calendar Page',
            calendars: calendar,
            user: []
        });
    }

    updateUserCalendar = async (req, reply) => {
        try {
            const userId = req.params.id;
            const calendarId = req.params.calendarId;
            const calendarUpdated = req.body.calendar;

            const calendarArray = await Calendar.getById(calendarId);
            const calendar = calendarArray[0];

            if (!calendar) {
                return reply.status(404).send({ error: 'Calendar not found' });
            }

            const user = await User.getByUsername(userId);
            if (!user || !user.hasCalendar(calendarId)) {
                return reply.status(404).send({ error: user ? 'You don\'t have the right to update this calendar' : 'User not found' });
            }

            calendar.name = calendarUpdated.name || calendar.name;
            calendar.class = calendarUpdated.class || calendar.class;
            calendar.color = calendarUpdated.color || calendar.color;
            calendar.url = calendarUpdated.url || calendar.url;
            calendar.syncExpressionCron = calendarUpdated.syncExpressionCron != "0" ? calendarUpdated.syncExpressionCron : calendar.syncExpressionCron;

            await calendar.updateChildrenCalendars(calendarUpdated);

            // added task to scheduler cron
            if (calendar.url != '' && Task.validate(calendar.syncExpressionCron) === false) {
                calendar.syncExpressionCron = "0 0 * * *";
            }
            else {
                calendar.updateTaskScheduler(calendarUpdated);
            }

            await calendar.persist();

            return reply.status(200).send({ calendar: [calendar], user: user });

        } catch (error) {
            console.log(error);
            return reply.status(500).send({ error: 'An unexpected error occurred' });
        }
    }

    async createUserCalendar(req, reply) {
        console.log("Create calendar request received")
        try {
            const userId = req.params.id;
            const user = await User.getByUsername(userId);

            if (!user) {
                return reply.status(404).send({ error: 'User not found' });
            }

            const calendar = new Calendar({
                name: "Yoda Basic Default",
                users: [user]
            });
            await calendar.persist();

            return reply.status(200).send({ message: 'Calendar created successfully', calendar: calendar });

        }
        catch (error) {
            console.log(error);
            return reply.status(500).send({ error: 'An unexpected error occurred' });
        }

    }

    async importUserCalendar(req, reply) {
        console.log("Import calendar request received")

        const { file: data, params: { id, calendarId } } = req;

        const calendar = await Calendar.getById(calendarId);
        if (!calendar) {
            console.error("Calendar not found");
            return reply.status(404).send({ error: 'Calendar not found' });
        }

        const user = await User.getBy('id', id);
        if (!user || !user.hasCalendar(calendarId)) {
            console.error("User not found or not authorized");
            return reply.status(404).send({ error: user ? 'You don\'t have the right to update this calendar' : 'User not found' });
        }

        const filePath = data.path;

        //parser le fichier et générer les events
        const uploadCalendar = new Calendar({
            source: filePath
        });

        await uploadCalendar.parseEvents();
        await calendar[0].mergeEventsCalendar(uploadCalendar.events);


        fs.unlink(filePath, (err) => {
            if (err) {
                console.error(err);
            }
        });

        console.log("File uploaded successfully")
        reply.status(200).send({ message: 'Calendar imported successfully' });
    }

    async subscribeUserCalendar(req, reply) {
        console.log("Subscribe calendar request received")
        const { id : username, calendarId} = req.params;

        const calendar = await Calendar.getById(calendarId);
        if (!calendar) {
            console.error("Calendar not found");
            return reply.status(404).send({ error: 'Calendar not found' });
        }

        const user = (await User.getBy('username', username))[0];

        if (!user) {
            console.error("User not found");
            return reply.status(404).send({ error: 'User not found' });
        }

        if (calendar[0].class === "PRIVATE") {
            console.error("Calendar is private");
            return reply.status(403).send({ error: 'Calendar is private' });
        }

        if (await user.haveAccessToCalendar(calendarId)) {
            console.error("Calendar already subscribed");
            return reply.status(403).send({ error: 'Calendar already subscribed' });
        }

        await user.addSubscribeCalendar(calendar[0].id);

        return reply.status(200).send({ message: 'Calendar subscribed successfully' });

    }

    async unsubscribeUserCalendar(req, reply) {
        console.log("Unsubscribe calendar request received")
        const { id : username, calendarId} = req.params;

        const calendar = await Calendar.getById(calendarId);
        if (!calendar) {
            console.error("Calendar not found");
            return reply.status(404).send({ error: 'Calendar not found' });
        }

        const user = (await User.getBy('username', username))[0];
        if (!user) {
            console.error("User not found");
            return reply.status(404).send({ error: 'User not found' });
        }

        if (await !user.haveAccessToCalendar(calendarId)) {
            console.error("Calendar not subscribed");
            return reply.status(403).send({ error: 'Calendar not subscribed' });
        }

        await user.removeSubscribeCalendar(calendar[0].id)

        return reply.status(200).send({ message: 'Calendar unsubscribed successfully' });

    }
}

module.exports = Webserver;