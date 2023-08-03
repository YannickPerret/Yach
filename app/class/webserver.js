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

    async submitCalendar (req, reply) {
        let calendar
        const data = await req.file()

        let selectedCalendars = req.body.calendars || [];

        if (data) {

            const originalName = data.filename;
            const extension = path.extname(originalName);
            const baseName = path.basename(originalName, extension);
            const date = Date.now();
        
            const newFileName = `${baseName}-${date}${extension}`;
            const filePath = path.join('./calendars/temps', newFileName);
        
            const storedFile = fs.createWriteStream(filePath);
        
            await pump(data.file, storedFile);
             // if a file is uploaded, add it to the selected calendars

            if (Array.isArray(selectedCalendars)) {
            selectedCalendars.push(data.path);
            } else if (selectedCalendars) {
            selectedCalendars = [selectedCalendars, data.path];
            } else {
            selectedCalendars = [data.path];
            }
        }

        // process the selected calendars
        if (Array.isArray(selectedCalendars)) { // if selectedCalendars is an array
            selectedCalendars.forEach((calendarPath, index) => {
                calendar = new Calendar({source : new FileAdapter({fileName: calendarPath, encoding: 'utf8'}), format: 'ics'});
                calendar.parseEvents();
            });
        } else { // if selectedCalendars is a string
            calendar = new Calendar({source : new FileAdapter({fileName: selectedCalendars.value, encoding: 'utf8'}), format: 'ics'});
            calendar.parseEvents();
        }

        calendar.persist();
        return { message : 'ok', calendars: calendar };
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