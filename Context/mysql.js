const Webhook = require('../Classes/Webhook.js');
const Server = require('../Classes/Server.js');

var async = require("async");
var mysql = require('mysql');

const config = require("../settings/config.json");

var connection = mysql.createConnection({
    host: config.sql.host,
    user: config.sql.username,
    password: config.sql.password,
    database: config.sql.database
});

connection.connect(function (err) {
    if (!err) {
        console.log("Database is connected");
    } else {
        console.log("Error connecting database: " + err);
    }
});

function GetServerByID(id) {
    return new Promise(function (resolve, reject) {
        connection.query("SELECT * FROM servers where serverid = " + mysql.escape(id) + ";", async function ExistCheck(err, result) {
            if (err) {
                console.log(err);
                resolve(undefined);
            }
            var server;
            result.forEach(function (item, err) {
                server = new Server(item.serverid, item.servername, item.owner);
            });
            resolve(server);
        });
    });
}

module.exports = {
    GetWebhooksFromServerID: async function (id, fn) {
        var returned = null;
        return new Promise(function (resolve, reject) {
            connection.query("SELECT * FROM servers WHERE servers.serverid = " + mysql.escape(id) + "", async function ExistCheck(err, result, fields) {
                //console.log("Checking for " + id);
                returned = result;
                if (result.length == 0) {
                    returned = null;
                }
                resolve(returned);
            });
        });
    },

    GetServerFromWebhook: async function (id) {
        var returned;
        return new Promise(function (resolve, reject) {
            connection.query("SELECT serverid FROM webhooks WHERE webhooks.webhook = '" + mysql.escape(id) + "'", async function ExistCheck(err, result, fields) {
                returned = "";
                //console.log("Checking for " + id);
                result.forEach(function (e, err) {
                    returned = e.serverid;
                });
                resolve(returned);
            });
        });
    },

    CreateServer: async function (id, servername, members, prefix, owner, region) {
        var returned;
        return new Promise(function (resolve, reject) {
            connection.query("INSERT INTO servers (`serverid`, `servername`, `members`, `prefix`, `owner`, `region`) VALUES (" + mysql.escape(id) + ", " + mysql.escape(servername) + ", " + mysql.escape(members.toString()) + ", " + mysql.escape(prefix) + ", " + mysql.escape(owner) + ", " + mysql.escape(region) + ");", async function ExistCheck(err, result) {
                if (err) {
                    console.log(err);
                    resolve("Couldn't create record!");
                }
                resolve("Successfully added");
            });
        });
    },

    UpdateServer: async function (id, servername, members, owner, region) {
        var returned;
        return new Promise(function (resolve, reject) {
            connection.query("UPDATE `servers` SET `servername`=" + mysql.escape(servername) + ", `members`=" + mysql.escape(members.toString()) + ", `owner`=" + mysql.escape(owner) + ", `region`=" + mysql.escape(region) + " WHERE `serverid`=" + mysql.escape(id) + ";", async function ExistCheck(err, result) {
                if (err) {
                    console.log(err);
                    resolve("Couldn't create record!");
                }
                resolve("Successfully added");
            });
        });
    },

    UpdateValue: async function (id, toset, newval) {
        return new Promise(function (resolve, reject) {
            try {
                connection.query("UPDATE `servers` SET " + toset + "=" + mysql.escape(newval) + " WHERE `serverid`=" + mysql.escape(id) + ";", async function ExistCheck(err, result) {
                    if (err) {
                        console.log(err);
                        resolve("Couldn't create record!");
                    }
                    resolve(true);
                });
            }
            catch (err) {
                resolve(false);
            }
        });
    },

    GetValue: async function(id, valuetocheck) {
        return new Promise(function (resolve, reject) {
            connection.query("SELECT * FROM servers WHERE servers.serverid = " + mysql.escape(id) + "", async function ExistCheck(err, result, fields) {
                returned = "";
                //console.log("Checking for " + id);
                result.forEach(function (e, err) {
                    returned = e[valuetocheck];
                });
                resolve(returned);
            });
        });
    }

    GetPrefix: async function (id) {
        var returned;
        return new Promise(function (resolve, reject) {
            connection.query("SELECT * FROM servers WHERE servers.serverid = " + mysql.escape(id) + "", async function ExistCheck(err, result, fields) {
                returned = "";
                //console.log("Checking for " + id);
                result.forEach(function (e, err) {
                    returned = e.prefix;
                });
                resolve(returned);
            });
        });
    },


    DeleteWebhook: async function (id) {
        var returned;
        return new Promise(function (resolve, reject) {
            connection.query("DELETE FROM webhooks WHERE webhook=" + mysql.escape(id) + ";", async function ExistCheck(err, result) {
                if (err) {
                    console.log(err);
                    resolve("Couldn't delete record!");
                }
                resolve("Successfully deleted");
            });
        });
    },

    CreateWebhook: async function (id, webhook) {
        return new Promise(function (resolve, reject) {
            connection.query("INSERT INTO webhooks (`webhook`, `serverid`) VALUES (" + mysql.escape(webhook) + "," + mysql.escape(id) + ");", async function ExistCheck(err, result) {
                if (err) {
                    console.log(err);
                    resolve("Couldn't create record!");
                }
                resolve("Successfully added");
            });
        });
    },

    GetWebhooksFromServer: async function (id) {
        return new Promise(function (resolve, reject) {
            connection.query("SELECT * FROM webhooks WHERE serverid=" + mysql.escape(id) + ";", async function ExistCheck(err, result) {
                if (err) {
                    console.log(err);
                    resolve("Couldn't retrieve record!");
                }
                resolve(result);
            });
        });
    },

    DeleteWebhooksOnServer: async function (id) {
        return new Promise(function (resolve, reject) {
            connection.query(`delete from webhooks where serverid = ${id};`, async function ExistCheck(err, result) {
                if (err) {
                    console.log(err);
                    resolve(false);
                }
                resolve(true);
            });
        });
    },

    GetAllWebhooks: async function () {
        return new Promise(function (resolve, reject) {
            connection.query("SELECT * FROM webhooks;", async function ExistCheck(err, result) {
                if (err) {
                    console.log(err);
                    resolve(undefined);
                }


                var webhooks = new Array();

                for (var i = 0; i < result.length; i++) {
                    var item = result[i];
                    var server = await GetServerByID(item.serverid);

                    var webhook = new Webhook(item.id, item.webhook, server);

                    if (webhook.server == undefined) {
                        console.log("Error, server with ID: " + item.serverid + " doesn't exist anymore. Webhook with ID: " + webhook.id + " wont be setup.");
                        var deleteresult = await DeleteWebhooksOnServer(item.serverid);

                        if (deleteresult) {
                            console.log("Removed webhooks on server ID: " + item.serverid);
                        }
                        else {
                            console.log("Failed at removing all webhooks from server ID " + item.serverid);
                        }
                    }
                    else {
                        webhooks.push(webhook);
                    }
                };

                resolve(webhooks);
            });
        });
    }
}