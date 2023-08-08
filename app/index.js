//**********************************************//

/************ Import / include  *****************/
const Webserver = require('./class/webserver');
const FileAdapter = require('./class/fileAdapter');
const yaml = require('js-yaml');
require('dotenv').config();


/******** Initalize *******/

let configFile = new FileAdapter({fileName: 'config.yaml', encoding: 'utf8'});

let config = yaml.load(configFile.load());

let webSever = new Webserver({port: process.env.ENDPOINT_PORT, fileConfig: config});
