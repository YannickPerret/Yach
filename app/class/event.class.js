class Event {
    constructor(config) {
      this.uuid = config.uuid;  
      this.summary = config.summary;  
      this.sequence = config.sequence; 
      this.status = config.status;
      this.transp = config.transp;
      this.rRule = config.rule;
      this.start = config.start;
      this.end = config.end;
      this.drStamp = config.drstamp;
      this.categories = config.categories;
      this.location = config.location;
      this.geo = config.geo;
      this.description = config.description;
      this.url = config.url;
    }
  
    formatEvent(event) {
      // Ici, vous pouvez implémenter la logique pour formater l'événement

    }
  
    parseEvent(event) {
      // Ici, vous pouvez implémenter la logique pour analyser l'événement
    }
  
    clearEvent() {
      // Ici, vous pouvez implémenter la logique pour réinitialiser les propriétés de l'événement
    }
  }
  

module.exports = Event;