const FileRequest = require('./fileRequest');
const UrlResquest = require('./urlRequest');

class SourceHandler {
    constructor(config) {
        this.source = config.source;
    }

    async parseData() {
        try {            
            if (this.source == null) throw new Error('No source file specified')

            if (this.source.startsWith('http') || this.source.startsWith('https')) {
                return new UrlResquest({source: this.source}).parseData();
            }
            else if (typeof this.source === 'string' || this.source instanceof String) {
                return new FileRequest({source: this.source}).parseData();
            } else {
                console.debug("Adaptateur non reconnu");
            }
        }
        catch (e) {
            console.debug(e);
            return null
        }
    }
}

module.exports = SourceHandler;