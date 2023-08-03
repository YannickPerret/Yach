const fs = require('fs');

class FileAdapter {
    constructor(config) {
        this.fileName = config.fileName;
        this.format = config.format || 'UTF8';
    }

    load() {
        return fs.readFileSync(this.fileName, this.format)
    }

    persiste() {

    }


    getExtension() {
        return this.fileName.substring(this.fileName.lastIndexOf('.') + 1)
    }
}

module.exports = FileAdapter;