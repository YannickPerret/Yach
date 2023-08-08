const Fastify = require('fastify');
const view = require('@fastify/view');
const ejs = require('ejs');
const routes = require('./router');
const path = require('path');
const fs = require('fs')
const Calendar = require('./calendar');
const FileAdapter = require('./fileAdapter');
const Event = require('./event');

const Ical = require('./adapter/ical');
const ICAL = require('ical.js');



const fastifyMulter = require('fastify-multer')

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

class Webserver {
    constructor(config) {
        this.app = Fastify({ logger: true });
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
            await this.app.listen({ port: this.port }, () => {
                console.log(`WEB SERVER : Server listening on port ${this.port}`);
            });
        }
        catch (err) {
            this.app.log.error(err)
            process.exit(1)
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

    // récupérer le calendrier via son id
        // Parser le body  pour le transformer en object ICS component
        // pour chaque event
            // Tester si l'event à un attribut last-modified
                //Si oui, Tester si l'id de l'event existe en base de données (find unique)
                //Si oui, tester si l'attribut last-modified de l'event est supérieur à celui en base de données
                    // Si oui, modifier l'event en base de données via son id
                     // Si non, ne rien faire
                // Si non, créer l'event en base de données
            // Tester si le type de calendrier est SHARED, récupérer les calendriers enfants
                // si oui, récupérer les calendriers enfants
                    // pour chaque calendrier enfant, ajouter l'id du calendrier et de l'event dans la table d'association event-calendar
                // si non, ajouter l'id du calendrier et de l'event dans la table d'association event-calendar

    async updateCalendar(req, reply) {
        console.log("Update calendar request received");
        
        let calendarId = req.params.id;
        let newListEvents = req.body;
    
        // Get the calendar by its id
        const calendar = await Calendar.getById(calendarId);
    
        if (!calendar) {
            return reply.status(404).send({ error: 'Calendar not found' });
        }
    
        // Parse the body to transform it into ICS component
        let jcalData = Ical.parse(newListEvents);
        let comp = Ical.component(jcalData);
    
        // Iterate over events in the parsed data
        for (let event of comp.getAllSubcomponents('vevent')) {
            let uid = event.getFirstPropertyValue('uid');
    
            // Check if the event has a last-modified attribute
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
                    calendarId: calendarId  // Ajoutez cette ligne
                });
    
                await newEvent.persist();
                await calendar.addEvent(newEvent);
            }
        }
    
        reply.send({ message: 'Calendar updated successfully' });
    }

    async submitCalendar(req, reply) {
        const data = req.file;
        const inputCalendarsSelected = req.body.calendars;
        const typeCalendar = ["PROFESSIONAL", "PERSONAL", "OTHER"].includes(req.body.type) ? req.body.type : "OTHER";
        const nameCalendar = req.body.name || "Yoda Default";

        let selectedCalendars = [];
        let filePath;
        let outputCalendar;

        if (inputCalendarsSelected && Array.isArray(inputCalendarsSelected) && inputCalendarsSelected.length > 0) {
            selectedCalendars = inputCalendarsSelected;
        }

        if (data) {
            filePath = data.path;

            const uploadCalendar = new Calendar({
                source: new FileAdapter({ fileName: filePath, encoding: 'utf8' }),
                format: 'ics',
                type: typeCalendar,
                name: nameCalendar
            });

            await uploadCalendar.persist();
            await uploadCalendar.parseEvents();

            for (const event of uploadCalendar.events) {
                event.calendarId = uploadCalendar.id;
                await event.persist();
            }

            selectedCalendars.push(filePath);

            outputCalendar = uploadCalendar;
        }

        if (Array.isArray(selectedCalendars) && selectedCalendars.length > 1) {
            const newParentCalendar = new Calendar({ name: nameCalendar, type: "SHARED" });
            await newParentCalendar.persist();

            for (const selectedCalendar of selectedCalendars) {
                const calendar = await Calendar.getById(selectedCalendar);
                calendar.parentCalendarId = newParentCalendar.id;
                await calendar.persist();
            }

            outputCalendar = newParentCalendar;
        } else if (!data) {
            return reply.status(400).send({ error: 'No calendars selected or uploaded' });
        }

        if (data) {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error(err);
                    return;
                }
            });
        }

        reply.send({ url: `${process.env.ENDPOINT_URL}:${process.env.ENDPOINT_PORT}/api/v1/calendar/${outputCalendar.id}` });
    }

    async getHome(req, reply) {
        let calendars = await Calendar.getAll();
        return reply.status(200).view('index.ejs', {
            title: 'Home Page',
            calendars: calendars,
        });
    }
}

module.exports = Webserver;