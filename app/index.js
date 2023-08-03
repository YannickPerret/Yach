//**********************************************//

/************ Import / include  *****************/
const Webserver = require('./class/webserver');
const Calendar = require('./class/calendar');
const FileAdapter = require('./class/fileAdapter');
const yaml = require('js-yaml');
require('dotenv').config();


/******** Initalize *******/

let configFile = new FileAdapter({fileName: 'config.yaml', encoding: 'utf8'});

let config = yaml.load(configFile.load());

//load file calendar
let fileCalendarEpsitec = new FileAdapter({fileName: config['Calendar Shared'].Epsitec, encoding: 'utf8'})
let fileCalendarPerso = new FileAdapter({fileName: config.source, encoding: 'utf8'})


// create calendar by file
let calendarEpsitec = new Calendar({source : fileCalendarEpsitec, format: fileCalendarEpsitec.getExtension()});
calendarEpsitec.parseEvents();

calendarEpsitec.generate()
let calendarPerso = new Calendar({source : fileCalendarPerso, format: fileCalendarPerso.getExtension()});


let webSever = new Webserver({port: process.env.ENDPOINT_PORT, fileConfig: config});


/*
try {
    let calendar = new Calendar({source: })

} catch (error) {
    console.error(error);
}*/