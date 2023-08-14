//**********************************************//

/************ Import / include  *****************/
const Webserver = require('./class/webserver');
const FileRequest = require('./class/handler/fileRequest');
const taskScheduler = require('./class/taskScheduler');
const yaml = require('js-yaml');
require('dotenv').config();


/******** Initalize *******/

let configFile = new FileRequest({source: 'config.yaml'});

let config = yaml.load(configFile.load());

let webSever = new Webserver({port: process.env.ENDPOINT_PORT, fileConfig: config});

let taskSchedulerManager = new taskScheduler();

taskSchedulerManager.start();
