const Fastify = require('fastify');
const view = require('@fastify/view');
const multipart = require('@fastify/multipart');
const ejs = require('ejs');
const routes = require('./router.class');
const path = require('path');
const fs = require('fs')
const pump = require('pump')

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

        this.app.register(multipart)

    }
    

    initRoutes() {
        routes(this.app, this);
    }

    start() {
        this.app.listen({ port: this.port }, () => {
            console.log(`WEB SERVER : Server listening on port ${this.port}`);
        });        
    }

    // Methodes

    getCalendar(req, res) {

    }

    getCalendars(req, res) {

    }

    getCalendarById(req, res) {

    }

   async submitCalendar(req, res) {
        const data = await req.file()

        const storedFile = fs.createWriteStream('./calendars/temps/' + data.filename)
        await pump(data.file, storedFile)

        return { message : 'ok'}

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