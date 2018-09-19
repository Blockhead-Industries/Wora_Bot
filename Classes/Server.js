'use strict';

module.exports = class Server {

    constructor(id, name, owner, webhooks) {
        this.id = id; // server id
        this.name = name; //name 
        this.owner = owner; //user object from discord.js
        this.webhooks = webhooks; //array
    }

    get id() {
        return this._id;
    }

    set id(value) {

        this._name = value;
    }

    get name() {
        return this._name;
    }

    set name(value) {
        this._name = value;
    }

    get webhooks() {
        return this._webhooks;
    }

    set webhooks(value) {
        this._webhooks = value;
    }

}