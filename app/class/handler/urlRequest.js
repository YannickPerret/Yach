const ParseData = require('./parseData');

class UrlResquest extends ParseData{
    constructor (config) {
        super();
        this.source = config.source;
    }

    async load() {
        try {
            const response = await fetch(this.source);
            return await response.text();
        } catch (err) {
            console.log(err);
            return null;
        }
    }

    async parseData() {
        let events = [];
        let data = await this.load();

        if (data) {
            events = await this.parseDataICS(data);
        }

        return events;
    }
}

module.exports = UrlResquest;