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

    async getCalendarById(req, reply) {
        let id = req.params.id;
        let sharedCalendarData
        let calendarData = await Calendar.getById(id);


        if (calendarData === null) {
            sharedCalendarData = await SharedCalendar.getById(id);
            if (!sharedCalendarData) {
                return reply.status(404).send({ error: 'No calendar found' });
            }
        }

        let comp = calendarData !== null ? calendarData.generate() : sharedCalendarData.generate();

        console.log(comp.toString());
        // set the correct headers
        reply.type('Content-Type', 'text/calendar');
        reply.status(200).send(comp.toString());
    }

    async updateCalendar(req, res) {
        let id = req.params.id;

        console.log(req.body)
        await Calendar.getById(id);

        console.log(req.body)

    }

    async submitCalendar(req, reply) {
        const data = req.file;
        const inputCalendarsSelected = req.body.calendars;
        const typeCalendar = req.body.type === "PROFESSIONAL" || req.body.type === "PERSONAL" || req.body.type === "OTHER" ? req.body.type : "OTHER";
        const nameCalendar = req.body.name ? req.body.name : "Yoda Default";
        let selectedCalendars = [];
        let filePath;
        let outpuCalendar;

        if (inputCalendarsSelected && inputCalendarsSelected.length > 0) {
            selectedCalendars = inputCalendarsSelected;
        }

        if (data) {
            filePath = data.path;
            console.log('File upload finished successfully');

            let uploadCalendar = new Calendar({ source: new FileAdapter({ fileName: filePath, encoding: 'utf8' }), format: 'ics', type: typeCalendar, name: nameCalendar});
            await uploadCalendar.persist();

            await uploadCalendar.parseEvents();

            for (let event of uploadCalendar.events) {
                event.calendarId = uploadCalendar.id;
                await event.persist();
            }
            
            selectedCalendars.push(filePath);
            console.log("one calendar upload")

            outpuCalendar = uploadCalendar
        }

        if (Array.isArray(selectedCalendars) && selectedCalendars.length > 0) {
            if (selectedCalendars.length > 1) {
                let newSharedCalendar = new SharedCalendar({ name: nameCalendar });

                for (let selectedCalendar of selectedCalendars) {
                    let calendar = await Calendar.getById(selectedCalendar)
                    await newSharedCalendar.add(calendar);
                }
                await newSharedCalendar.persist();

                console.log("multiple calendar upload")
                outpuCalendar = newSharedCalendar;
            }

            if (data) {
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                }
                )
            }
        }
        else
            return reply.status(400).send({ error: 'No calendars selected' });

        reply.send({ url: `${process.env.ENDPOINT_URL}:${process.env.ENDPOINT_PORT}/api/v1/calendar/${outpuCalendar.id}` });
    }

    // Static views home 
    async getHome(req, reply) {

        //get all calendar by database Calendar
        let calendars = await Calendar.getAll();
        let sharedCalendars = await SharedCalendar.getAll();

        return reply.status(200).view('index.ejs', {
            title: 'Home Page',
            calendars: calendars,
            sharedCalendars: sharedCalendars
        });
    }
}

module.exports = Webserver;



//http://localhost:3000/api/v1/calendar/ac57b6da-e246-43b7-bff2-d557f42413ba