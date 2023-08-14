const ParseData = require('./parseData');

class UrlResquest extends ParseData{
    constructor (config) {
        super();
        this.source = config.source;
    }

    async load() {
        return await fetch(this.source)
        .then(res => res.text())
        .then(body => body)
        .catch(err => console.log(err));
    }

    async parseData() {
        let events = [];
        let data = this.load();

        events = await super.parseDataICS(data);

        return events;
    }
}

module.exports = UrlResquest;