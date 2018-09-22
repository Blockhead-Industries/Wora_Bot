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

async function checkexist(id, fn) {
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
}

function checkexistbyhook(id) {
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
}

async function createserver(id, servername, members, prefix, owner, region) {
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
}


//UPDATE `database`.`servers` SET `servername`='34', `members`='60', `prefix`='34', `owner`='34', `region`='34' WHERE `serverid`='250621419325489153';

function updateall(id, servername, members, owner, region) {
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
}

function update(id, toset, newval) {
    var returned;
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
}


function checkprefix(id) {
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
}

function checkprefixbyhook(id) {
    var returned;
    return new Promise(function (resolve, reject) {
        connection.query("SELECT serverid FROM webhooks WHERE webhooks.webhook = " + mysql.escape(id) + "", async function ExistCheck(err, result, fields) {
            returned = "";
            //console.log("Checking for " + id);
            result.forEach(function (e, err) {
                returned = e.serverid;
            });
            resolve(returned);
        });
    });
}

function checkvalue(id, valuetocheck) {
    var returned;
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

function deleterecord(id) {
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
}

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

function DeleteWebhooksOnServer(id) {
    return new Promise(function (resolve, reject) {
        connection.query(`delete from webhooks where serverid = ${id};`, async function ExistCheck(err, result) {
            if (err) {
                console.log(err);
                resolve(false);
            }
            resolve(true);
        });
    });
}

function GetAllWebhooks() {
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

module.exports = {
    getserver: async function (id) {
        var boola = await checkexist(id);
        return boola;
    },

    getserverbyhook: async function (id) {
        var boola = await checkexistbyhook(id);
        return boola;
    },

    create: async function (id, servername, members, prefix, owner, region) {
        var boola = await createserver(id, servername, members, prefix, owner, region);
        return boola;
    },

    update: function (serverid, servername, members, owner, region) {
        updateall(serverid, servername, members, owner, region);
    },

    delete: async function (deleteid) {
        boola = await deleterecord(deleteid);
        return boola;
    },

    getprefix: async function (serverid) {
        boola = await checkprefix(serverid);
        return boola;
    },

    setprefix: async function (serverid, newprefix) {
        boola = await update(serverid, "prefix", newprefix);
        console.log("set prefix: " + boola);
        return boola;
    },

    setplaytime: async function (serverid, newprefix) {
        boola = await update(serverid, "maxplaytime", newprefix);
        console.log("set playtime: " + newprefix);
        return boola;
    },

    updatevalue: async function (serverid, valuetoupdate, newvalue) {
        boola = await update(serverid, valuetoupdate, newvalue);
        console.log("set newvalue: " + newvalue);
        return boola;
    },

    getvalue: async function (serverid, valuetotcheck) {
        boola = await checkvalue(serverid, valuetotcheck);
        return boola;
    },

    createwebhook: async function (id, webhook) {
        var returned;
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

    getallwebhooks: async function (id) {
        var returned;
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

    getsetup: async function () {
        return await GetAllWebhooks();
    }
};