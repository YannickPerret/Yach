//**********************************************//

/************ Import / include  *****************/
const Webserver = require('./class/webserver.class');
const Calendar = require('./class/calendar.class');
const FileManager = require('./class/fileManager.class');
const yaml = require('js-yaml');
require('dotenv').config();


/******** Initalize *******/

let webSever = new Webserver({port: process.env.ENDPOINT_PORT});
let fileConfig = new FileManager({source: 'config.yaml', encoding: 'utf8'});
let fileCalendarEpsitec = new FileManager({source: config['Calendar Shared'].Epsitec, encoding: 'utf8'})
let fileCalendarPerso = new FileManager({source: config.source, encoding: 'utf8'})


let config = yaml.load(fileConfig.openAndRead());


console.log(config);

let calendarEpsitec = new Calendar({source : fileCalendarEpsitec, format: fileCalendarEpsitec.getExtension()});
let calendarPerso = new Calendar({source : fileCalendarPerso, format: fileCalendarPerso.getExtension()});


console.log(calendarEpsitec);
console.log(calendarPerso);

/*
try {
    let calendar = new Calendar({source: })

} catch (error) {
    console.error(error);
}*/