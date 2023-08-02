const Fastify = require('fastify');
const view = require('@fastify/view');
const ejs = require('ejs');
const routes = require('./router.class');
const path = require('path');

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

    // Static views home 
    getHome(req, res) {
        let calendars = Object.entries(this.fileConfig['Calendar Shared']).map(([name, path], index) => {
            return { id: `cal${index}`, name: name, path: path };
          });
        
        res.view('index.ejs', {
            title: 'Home',
            calendars: calendars
        });
    }
}

module.exports = Webserver;