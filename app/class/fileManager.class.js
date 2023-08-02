const fs = require('fs');

class FileManager {
    constructor(config) {
        this.fileName = config.fileName;
        this.format = config.format || 'UTF8';
        this.instance = null;

        //singleton patter for fileManager
        if (FileManager.instance instanceof FileManager) {
            return FileManager.instance;
        }
        FileManager.instance = this;
    }

    openAndRead() {
        return fs.readFileSync(this.fileName, this.format)
    }

    getExtension() {
        return this.fileName.substring(this.fileName.lastIndexOf('.') + 1)
    }
}

module.exports = FileManager;