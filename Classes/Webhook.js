class Webhook {

    constructor(id, source, target, server) {
        this.id = id;
        this.source = source;
        this.target = target;
        this.server = server;
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