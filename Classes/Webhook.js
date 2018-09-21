﻿'use strict';

const config = require("../Settings/config.json");

module.exports = class Webhook {
    constructor(id, url, server) {
        this._id = id; //webhook id
        this._url = url; //url from this
        this._server = server; //Server class
    }

    get id() {
        return this._id;
    }

    set id(value) {

        this._id = value;
    }

    get server() {
        return this._server;
    }

    set server(value) {

        this._server = value;
    }

    get url() {
        return this._url;
    }

    set url(value) {

        this._url = value;
    }

    get cleanurl() {
        var inbound = this._url.replace(config.costum.discordwebhookurl, "");
        return inbound;
    }

}