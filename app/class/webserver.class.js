const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./router.class');

class Webserver {
    constructor(config) {
        this.app = express();
        this.port = config.port;

        this.initMiddleware();
        this.initRoutes();
    }

    initMiddleware() {
        // ajouter les cors    
        this.app.use(express.static('../public'));
        this.app.use(bodyParser.json());
    }

    initRoutes() {
        const apiRoutes = routes(this);
        this.app.use('/api/v1', apiRoutes);

        this.app.listen(this.port, () => {
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
}

module.exports = Webserver;