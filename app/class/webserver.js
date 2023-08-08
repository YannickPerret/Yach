const Fastify = require('fastify');
const view = require('@fastify/view');
const ejs = require('ejs');
const routes = require('./router');
const path = require('path');
const fs = require('fs')
const Calendar = require('./calendar');
const SharedCalendar = require('./sharedCalendar');
const FileAdapter = require('./fileAdapter');

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
        let sharedCalendarData

        let calendarData = await Calendar.getById(id);

        if (calendarData === null) {
            sharedCalendarData = await SharedCalendar.getById(id);
            if (sharedCalendarData === null) {
                return res.status(404).send({ error: 'No calendar found' });
            }
        }
        let comp = calendarData !== null ? calendarData.generate() : sharedCalendarData.generate();

        // set the correct headers
        res.type('Content-Type', 'text/calendar');
        res.status(200).send(comp.toString());
    }

    async propfindCalendar(req, res) {
        let id = req.params.id;
        let sharedCalendarData;

        console.log("PROPFIND request received for calendar:", id);

        // set the correct headers
        res.type('Content-Type', 'text/calendar');
        res.status(207).send();  // 207 Multi-Status is commonly used for PROPFIND responses
    }

    async updateCalendar(req, reply) {
        console.log("Update calendar request received");

        let id = req.params.id;
        let newEvents = req.body;
        let sharedCalendar;

        try {
            let calendar = await Calendar.getById(id);
            if (calendar === null) {
                sharedCalendar = await SharedCalendar.getById(id);
                if (sharedCalendar === null) {
                    return reply.status(404).send({ error: 'No calendar found' });
                }
                else {
                    for (let calendar of sharedCalendar.calendars) {
                        console.debug(calendar.getEvents())

                    }
                }
            }




            reply.status(200).send(calendar);
        } catch (error) {
            console.error(error);
            reply.status(500).send({ error: 'Server error' });
        }
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
    // Static views home 
    async getHome(req, reply) {

        //get all calendar by database Calendar
        let calendars = await Calendar.getAll();

        return reply.status(200).view('index.ejs', {
            title: 'Home Page',
            calendars: calendars,
        });
    }
}

module.exports = Webserver;