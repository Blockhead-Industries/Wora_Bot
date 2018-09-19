class Webhook {

    constructor(id, source, target, server) {
        this.id = id;
        this.source = source; //url from discord
        this.target = target; //url from this
        this.server = server; //Server class
    }

    get id() {
        return this._id;
    }

    set id(value) {

        this._name = value;
    }

    get source() {
        return this._source;
    }

    set source(value) {
        this._source = value;
    }

    get server() {
        return this._id;
    }

    set server(value) {

        this._server = value;
    }

}