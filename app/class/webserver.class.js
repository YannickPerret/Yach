const express = require('express');


class Webserver {

    constructor(config) {
        this.app = express();
    }
}

exports.default = Webserver;