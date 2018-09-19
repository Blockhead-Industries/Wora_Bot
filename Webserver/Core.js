const express = require('express')
const request = require('request')
const bodyParser = require('body-parser')

let app = express()
app.use(express.json());

function setuplink(target) {
    console.log("Setup for: " + target)
    var inbound = target.replace("https://discordapp.com/api/webhooks/", "")
    app.post("/" + inbound, function (req, res) {
        try {
            console.log(target + " - DATA: " + req.body.username + " - " + req.body.content);
            let data = req.body
            request({
                url: target,
                method: "POST",
                json: req.body
            }, function (err, xhr, body) {
                if (xhr != undefined && xhr.statusCode != undefined && !(xhr.statusCode === 204)) {
                    return res.send("Discord API returned an error.");
                }

                if (req.body.username == undefined || req.body.content == undefined || req.body.content == "" || req.body.username == "") {
                    var serverid = sql.getserverbyhook(target);
                    var server = sql.getserver(serverid);

                }
                return res.send("Successfully posted data to webhook.");
            })

        }
        catch (err) {
            console.log(err)
        }
    })
    console.log("Setup finished for: " + target)
    return ("http://" + discordbotlink + ":3000/" + inbound)
}

app.listen(config.webhook.port, function () {
    console.log('Server is running on port 3000.');
})

