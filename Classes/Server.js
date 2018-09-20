'use strict';

module.exports = class Server {

    constructor(id, name, owner, webhooks) {
        this._id = id; // server id
        this._name = name; //name 
        this._owner = owner; //user object from discord.js
        this._webhooks = webhooks; //array
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

    get owner() {
        return this._owner;
    }

    set owner(value) {
        this._owner = value;
    }
}