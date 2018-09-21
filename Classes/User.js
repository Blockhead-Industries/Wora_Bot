'use strict';

module.exports = class User {

    constructor(id, name, owner, webhooks) {
        this._id = id; // server id


    }

    get id() {
        return this._id;
    }

    set id(value) {

        this._name = value;
    }

    async getadminuser() {
        return new Promise(async function (resolve, reject) {
            var result = [];
            config.settings.admins.forEach(async function (admin) {
                var x = await getuser(admin);
                result.push(x);
            });
            resolve(await result);
        })
    }

    async sendmessage(message) {
        var user = await getuser(id);
        user.send(message);
    }

    async isadmin(id) {
        return false;
    }

    async sendtoadmin(message) {
        console.log(message);
        if (admins == undefined) {
            admins = await getadminuser();
        }
        console.log("Sending message: " + message.toString());
        admins.forEach(function (admin) {
            admin.send(message.toString());
        });
    }

}