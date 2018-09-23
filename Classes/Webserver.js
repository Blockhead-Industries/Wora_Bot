'use strict';

const express = require('express');
const request = require('request');
let app = express();
app.use(express.json());

const bodyParser = require('body-parser');

function SendError(webhook, error) {
    var data = [];
    data.title = `Error occured for: ${webhook.server.id}`;
    data.description = `One of your webhook calls had an error occur.`;
    data.timestamp = `Occured at: ${new Date()}`;
    data = new Discord.RichEmbed(data);

    data.addField(`ID`, webhook.id, true);
    data.addField(`URL`, webhook.url, true);

    webhook.server.owner.send(data);
}

module.exports = class Webserver {
    constructor(servername, port, legacyservername) {
        console.log("Starting webserver: " + servername + " on port " + port);

        this._servername = servername; //servername
        this._port = port; //port to run webserver on
        this._legacyservername = legacyservername; //legacyservername 

        app.listen(port, function () {
            console.log('Server is running on port ' + port + '.');
        });

    }

    setuplink(webhook) {
        console.log("Setting up webhook: " + webhook.id);
        var result;
        var inbound = webhook.cleanurl;
        app.post("/" + inbound, function (req, res) {
            console.log(webhook.url + " - DATA: " + req.body.username + " - " + req.body.content);
            let data = req.body;
            request({
                url: webhook.url,
                method: "POST",
                json: req.body
            }, function (err, xhr, body) {
                if (xhr != undefined && xhr.statusCode != undefined && !(xhr.statusCode === 204)) {
                    return res.send("Discord API returned an error.");
                }

                if (req.body.username == undefined || req.body.content == undefined || req.body.content == "" || req.body.username == "") {
                    SendError(webhook, err);
                }
                return res.send("Successfully posted data to webhook.");
            });
        });
        result = "http://" + this._servername + ":" + this._port + "/" + inbound;
        return result;
    }
}