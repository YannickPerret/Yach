//**********************************************//

/************ Import / include  *****************/
const Webserver = require('./class/webserver');
const FileRequest = require('./class/handler/fileRequest');
const TaskScheduler = require('./class/taskScheduler');
const Calendar = require('./class/calendar');
const yaml = require('js-yaml');
require('dotenv').config();


/******** Initalize *******/

let configFile = new FileRequest({source: 'config.yaml'});

let config = yaml.load(configFile.load());

let webSever = new Webserver({port: process.env.ENDPOINT_PORT, fileConfig: config});

let taskSchedulerManager = TaskScheduler.getInstance();
(async () => {
    try{
        const calendarsWithUrl = await Calendar.getBy("url", "is not null")
        if (calendarsWithUrl.length > 0) {
            for (const calendar of calendarsWithUrl) {
                taskSchedulerManager.addTask(calendar.syncExpressionCron, calendar.sync, {name: `Sync ${calendar.name}`});
            }
        }
    }
    catch (err) {
        console.debug(err);
    }
})();


