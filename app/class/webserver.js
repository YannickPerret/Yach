const Fastify = require('fastify');
const view = require('@fastify/view');
const multipart = require('@fastify/multipart');
const ejs = require('ejs');
const routes = require('./router');
const path = require('path');
const fs = require('fs')
const pump = require('pump')
const Calendar = require('./calendar');
const FileAdapter = require('./fileAdapter');

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

        this.app.register(multipart, { attachFieldsToBody: true })

    }


    initRoutes() {
        routes(this.app, this);
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

    getCalendarById(req, res) {

    }

    async submitCalendar(req, reply) {
        let calendar
        const data = await req.body.file
    
        let selectedCalendars = [];

        if (req.body.calendars && req.body.calendars.value.length > 0) {
            selectedCalendars.push(req.body.calendars.value);
        }

        console.log(data)
        if (data.filename !== "") {
            const originalName = data.filename;
            const extension = path.extname(originalName);
            const baseName = path.basename(originalName, extension);
            const date = Date.now();
    
            const newFileName = `${baseName}-${date}${extension}`;
            const filePath = path.join('./calendars/temps', newFileName);
    
            const storedFile = fs.createWriteStream(filePath);
            await pump(data.file, storedFile);
            storedFile.end();
    
            selectedCalendars.push(filePath);
        }
    
        // process the selected calendars
        // create a single calendar object
        calendar = new Calendar({ format: 'ics' });
        await calendar.persist();
    
        console.log("selectedCalendars", selectedCalendars)
    
        if (Array.isArray(selectedCalendars)) {
            await selectedCalendars.forEach(async (calendarPath, index) => {
                let tempCalendar = new Calendar({ source: new FileAdapter({ fileName: calendarPath, encoding: 'utf8' }), format: 'ics' });
                await tempCalendar.parseEvents();
                // add each event to the main calendar
                calendar.events.push(...tempCalendar.events);
            });
            
           for (let event of calendar.events) {
                event.calendarId = calendar.id;
                await event.persist();
            }
        }
    
        return { message: 'ok', calendars: calendar };
    }


    // Static views home 
    getHome(req, res) {
        let calendars = Object.entries(this.fileConfig['Calendar Shared']).map(([name, path], index) => {
            return { id: `cal${index}`, name: name, path: path };
        });

        res.view('index.ejs', {
            title: 'Home Page',
            calendars: calendars
        });
    }
}

module.exports = Webserver;