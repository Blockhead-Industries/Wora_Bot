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

function print(message, override) {
    if (config.costum.debugging || override) {
        console.log(`MYSQL.JS: ${message}`);
    }
}

connection.connect(function (err) {
    if (!err) {
        print("Database is connected", true);
    } else {
        print("Error connecting database: " + err, true);
    }
});



function GetServerByID(id, client) {
    return new Promise(function (resolve, reject) {
        connection.query("SELECT * FROM servers where serverid = " + mysql.escape(id) + ";", async function ExistCheck(err, result) {
            if (err) {
                print(err);
                resolve(undefined);
            }
            var server;
            for (var i = 0; i < result.length; i++) {
                var item = result[i];
                server = new Server(item.serverid, item.servername, item.owner);
                if (client !== undefined) {
                    server.owner = await client.fetchUser(item.owner);
                }
            };
            resolve(server);
        });
    });
}

async function PutTogether_Webhook(item, client) {
    return new Promise(async function (resolve, reject) {
        try {
            var server = await GetServerByID(item.serverid, client);

            var webhook = new Webhook(item.id, item.webhook, server);

            if (webhook.server === undefined) {
                print("Error, server with ID: " + item.serverid + " doesn't exist anymore. Webhook with ID: " + webhook.id + " wont be setup.");
                var deleteresult = await module.exports.DeleteWebhooksOnServer(item.serverid);

                if (deleteresult) {
                    print("Removed webhooks on server ID: " + item.serverid);
                }
                else {
                    print("Failed at removing all webhooks from server ID " + item.serverid);
                }
                resolve(undefined);
            }
            else {
                resolve(webhook);
            }
        }
        catch (error) {
            print(error.message);
            resolve(undefined);
        }
    });
}

module.exports = {
    GetServerFromWebhook: async function (id) {
        var returned;
        return new Promise(function (resolve, reject) {
            connection.query("SELECT serverid FROM webhooks WHERE webhooks.webhook = '" + mysql.escape(id) + "'", async function ExistCheck(err, result, fields) {
                returned = "";
                //print("Checking for " + id);
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
                    print(err);
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
                    print(err);
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
                        print(err);
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

    GetValue: async function (id, valuetocheck) {
        return new Promise(function (resolve, reject) {
            connection.query("SELECT * FROM servers WHERE servers.serverid = " + mysql.escape(id) + "", async function ExistCheck(err, result, fields) {
                returned = "";
                //print("Checking for " + id);
                result.forEach(function (e, err) {
                    returned = e[valuetocheck];
                });
                resolve(returned);
            });
        });
    },

    GetPrefix: async function (id) {
        var returned;
        return new Promise(function (resolve, reject) {
            connection.query("SELECT * FROM servers WHERE servers.serverid = " + mysql.escape(id) + "", async function ExistCheck(err, result, fields) {
                returned = "";
                //print("Checking for " + id);
                result.forEach(function (e, err) {
                    returned = e.prefix;
                });
                resolve(returned);
            });
        });
    },

    GetWebhookByUrl: async function (url) {
        return new Promise(function (resolve, reject) {
            connection.query("SELECT * FROM webhooks WHERE webhook like '"+url+"';", async function ExistCheck(err, result) {
                if (err) {
                    print(err);
                    resolve(undefined);
                }
                console.log(url);
                if (result !== undefined) {
                    var webhook = await PutTogether_Webhook(result[0]);
                    resolve(webhook);
                }
                resolve(undefined);
            });
        });
    },

    DeleteWebhook: async function (id) {
        var returned;
        return new Promise(function (resolve, reject) {
            connection.query("DELETE FROM webhooks WHERE id=" + mysql.escape(id) + ";", async function ExistCheck(err, result) {
                if (err) {
                    print(err);
                    resolve(false);
                }
                resolve(true);
            });
        });
    },

    CreateWebhook: async function (id, webhook) {
        return new Promise(function (resolve, reject) {
            connection.query("INSERT INTO webhooks (`webhook`, `serverid`) VALUES (" + mysql.escape(webhook) + "," + mysql.escape(id) + ");", async function ExistCheck(err, result) {
                if (err) {
                    print(err);
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
                    print(err);
                    resolve("Couldn't retrieve record!");
                }
                var webhooks = new Array();

                for (var i = 0; i < result.length; i++) {
                    var item = result[i];
                    var webhook = await PutTogether_Webhook(item);
                    if (webhook !== undefined) {
                        webhooks.push(webhook);
                    }
                };

                resolve(webhooks);
            });
        });
    },

    DeleteWebhooksOnServer: async function (id) {
        return new Promise(function (resolve, reject) {
            connection.query(`delete from webhooks where serverid = ${id};`, async function ExistCheck(err, result) {
                if (err) {
                    print(err);
                    resolve(false);
                }
                resolve(true);
            });
        });
    },

    GetAllWebhooks: async function (client) {
        return new Promise(function (resolve, reject) {
            connection.query("SELECT * FROM webhooks;", async function ExistCheck(err, result) {
                if (err) {
                    print(err);
                    resolve(undefined);
                }
                var webhooks = new Array();

                for (var i = 0; i < result.length; i++) {
                    var item = result[i];
                    var webhook = await PutTogether_Webhook(item, client);

                    if (webhook !== undefined) {
                        var pass = true;

                        for (var x = 0; x < webhooks.length; x++) {
                            var registered_webhook = webhooks[x];

                            if (registered_webhook.url === webhook.url) {

                                webhook.server.owner.send(`I found a webhook duplicate webhook in the database that belongs to one of your servers. I am now deleting the duplicate one, the original will still be functional. You may ignore this message if it doesn't reoccur.`);

                                print(`DOUBLE WEBHOOK FOUND WITH ID: ${webhook.id}. DELETING`, true);

                                pass = false;
                                module.exports.DeleteWebhook(webhook.id);
                            }
                        }

                        if (pass) {
                            webhooks.push(webhook);
                        }
                    }
                };

                resolve(webhooks);
            });
        });
    },
}