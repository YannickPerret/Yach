const fs = require('fs');
const ParseData = require('./parseData');

class FileRequest extends ParseData {
    constructor(config) {
        super();
        this.source = config.source;
    }

    async load() {
        return await fs.readFileSync(this.source, "utf-8")
    }

    persiste() {
        // Votre code ici
    }

    getExtension() {
        return this.source.substring(this.source.lastIndexOf('.') + 1)
    }

    async parseData() {
        let events = [];
        let data = await this.load();
        
        switch (this.getExtension()) {
            case 'ics':
                events = await this.parseDataICS(data);
                break;
            case 'json':
                // Votre code ici pour JSON
                break;
            case 'csv':
                // Votre code ici pour CSV
                break;
            case 'xlsx':
                // Votre code ici pour XLSX
                break;
            default:
                console.log("Extension de fichier non reconnue");
        }
        return events;
    }
}

module.exports = FileRequest;
