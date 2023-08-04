const Fastify = require('fastify');
const view = require('@fastify/view');
const ejs = require('ejs');
const routes = require('./router');
const path = require('path');
const fs = require('fs')
const Calendar = require('./calendar');
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

    getCalendar(req, res) {

    }

    getCalendars(req, res) {

    }

    async getCalendarById(req, reply) {
        let id = req.params.id;

        let calendarData = await Calendar.getCalendarById(id);

        let comp = calendarData.generate();

        // set the correct headers
        reply.type('Content-Type', 'text/calendar');
        reply.status(200).send(comp.toString());
    }

    async submitCalendar(req, reply) {
        if (!req.file) {
            return reply.code(400).send('File is missing');
        }
    
        let calendar;
        const data = req.file;
        const inputCalendarsSelected = req.body.calendars;
        let selectedCalendars = [];
    
        if (inputCalendarsSelected && inputCalendarsSelected.length > 0) {
            selectedCalendars.push(inputCalendarsSelected);
        }
    
        if (data) {
            const filePath = data.path;
            console.log('File upload finished successfully');
            selectedCalendars.push(filePath);
        }
    
        calendar = new Calendar({ format: 'ics' });
        await calendar.persist();
    
        if (Array.isArray(selectedCalendars)) {
            await selectedCalendars.forEach(async (calendarPath, index) => {
                let tempCalendar = new Calendar({ source: new FileAdapter({ fileName: calendarPath, encoding: 'utf8' }), format: 'ics' });
                await tempCalendar.parseEvents();
                calendar.events.push(...tempCalendar.events);
            });
    
            for (let event of calendar.events) {
                event.calendarId = calendar.id;
                await event.persist();
            }
        }
    
        reply.send({ url: `${process.env.ENDPOINT_URL}:${process.env.ENDPOINT_PORT}/api/v1/calendar/${calendar.id}` });
    }
    
    
    


    // Static views home 
    getHome(req, reply) {
        let calendars = Object.entries(this.fileConfig['Calendar Shared']).map(([name, path], index) => {
            return { id: `cal${index}`, name: name, path: path };
        });

        reply.status(200).view('index.ejs', {
            title: 'Home Page',
            calendars: calendars
        });
    }
}

module.exports = Webserver;



//http://localhost:3000/api/v1/calendar/ac57b6da-e246-43b7-bff2-d557f42413ba