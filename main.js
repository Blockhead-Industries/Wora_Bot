const config = require("./config.json");
const sql = require("./sql.js");

const OS = require('os');

const configcommands = require("./Commands/configuration.js");
const infocommands = require("./Commands/info.js");
const webhookcommands = require("./Commands/webhook.js");

configcommands.init(sql, config);
infocommands.init(sql, config, OS);
webhookcommands.init(sql, config);


const Discord = require("discord.js");
const client = new Discord.Client();
const discordtoken = config.discordtoken;

const express = require('express')
const request = require('request')
const bodyParser = require('body-parser')

let app = express()
app.use(express.json());


var defaultprefix = config.defaultprefix;
var botver = config.botver;
var versioninfo = config.versioninfo;
var discordbotlink = config.botlink;
var statusbot = defaultprefix + "help | " + discordbotlink;
var commands = [
    "help", "List of commands.",
    "prefix [new prefix]", "Set a new prefix for the bot.",
    "ping", "Ping of the bot to discord.",
    "you", "Bot information",
    "serverinfo", "Server information",
    "link [webhook]", "Sets a webhook to redirect. I do not setup discord webhooks myself. Thats your problem.",
    "links", "Shows all webhooks.",
    "deletelink", "deletes the webhook.",
];


client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    await sendtoadmin("I have been started on: " + OS.hostname() + " - " + botver);
    await sendtoadmin(`Ready to serve on ${client.guilds.size} servers, for ${client.users.size} users.`);
    client.user.setActivity(statusbot);
});

client.on('guildCreate', async guild => {
    sendtoadmin(`Connected to a discord: ` + guild.name + " - " + (guild.memberCount - 1) + " members");
});

client.on('guildDelete', async guild => {
    sendtoadmin(`Disconnected from a discord: ` + guild.name + " - " + (guild.memberCount - 1) + " members");
});

//this is crappy coding, yes I know. This is temporary. I am currently reworking the framework for all my bots.

function getuser(id) {
    return new Promise(async function (resolve, reject) {
        console.log("getting user: " + id.toString());
        var x = await client.fetchUser(id.toString());
        resolve(x);
    })
}

async function sendmessagetouser(id, message) {
    var user = await getuser(id);
    user.send(message);
}

var admins;

function getadminuser() {
    return new Promise(async function (resolve, reject) {
        var result = [];
        config.admins.forEach(async function (admin) {
            console.log("getting admin user: " + admin.toString());
            var x = await client.fetchUser(admin.toString());
            result.push(x);
        });
        resolve(result);
    })
}

async function sendtoadmin(message) {
    console.log(message);
    if (admins == undefined) {
        admins = await getadminuser();
    }
    console.log("Sending message: " + message.toString());
    admins.forEach(function (admin) {
        admin.send(message.toString());
    });
}

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
                if (xhr != undefined && xhr.statusCode != undefined && !(xhr.statusCode === 204)) return res.send("Discord API returned an error.");
                if (req.body.username == undefined || req.body.content == undefined || req.body.content == "" || req.body.username == "") {
                    var serverid = sql.getserverbyhook(target);
                    var server = sql.getserver(serverid);
                    sendtoadmin("Being triggered without data by: **" + server.servername + "** owned by <@" + server.owner + ">");
                    sendmessagetouser(server.owner, "Hello, a webhook that you have created is being used but no data is being sent through it. If this occurs more often one of the admins may contact you to resolve this. You are recieving this message due to Discord being quite strict on their rules about how you are allowed to use a webhook. \n Webhook targeted: "+target+"")
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

app.listen(3000, function () {
    console.log('Server is running on port 3000.');
})

client.on('message', async message => {
    var message = await message;
    if (message.author != client.user) {
        if (message.channel.type === 'dm') { //dm
            var string = "";
            config.admins.forEach(async function (admin) {
                string += " or <@" + admin + ">";
            });
            message.reply("Hi! I have no functioning commands here. If you want to talk about me contact " + string + ". Or to add me visit " + config.botlink)
        }

        else {
            if (message.guild.available) {
                const user = message.author;

                var out = await sql.getserver(await message.guild.id)
                if (out == null) {//id,servername,members,prefix,owner
                    console.log("Creation of record: " + await sql.create(message.guild.id, message.guild.name, message.guild.memberCount, defaultprefix, await message.guild.ownerID, message.guild.region));
                }
                else {
                    sql.update(message.guild.id, message.guild.name, message.guild.memberCount, await message.guild.ownerID, message.guild.region) //async
                }

                const permmember = await message.channel.permissionsFor(client.user);
                try {
                    if (user.tag !== client.user.tag) {
                        console.log("[" + message.guild.name + "]" + message.author.tag + " - " + message.content);

                        messageParts = message.content.split(' ');
                        input = messageParts[0].toLowerCase();
                        parameters = messageParts.splice(1, messageParts.length);
                        prefix = await sql.getprefix(message.guild.id);
                        gotroleid = await sql.getvalue(message.guild.id, "PermRole");

                        if (input === prefix + "ping") {
                            infocommands.ping(client, message);
                        }
                        else if (input === prefix + "you") {
                            infocommands.botinfo(client, message);
                        }
                        else if (input === prefix + "deletelink") {
                            webhookcommands.deletelink(client, message);
                        }
                        else if (input === prefix + "link") {
                            if (await PermCheck(message, message.author, gotroleid) == true) {
                                if (parameters.length != 0) {
                                    if (parameters[0].includes("https://discordapp.com/api/webhooks/")) {
                                        message.reply("I will send messages in private, execute commands here. I deleted your message to ensure our safety!")
                                        var mes = message;
                                        message.delete()
                                        mes.author.send("Give me a moment. I am setting up the redirect for " + parameters[0])
                                        var tick = await sql.createwebhook(mes.guild.id, parameters[0])
                                        if (tick != "Couldn't create record!") {
                                            var link = await setuplink(parameters[0])
                                            mes.author.send("Finished and completed setup. You can use this webhook: " + link)
                                            sendtoadmin("A webhook has been created in the following guild: " + message.guild.name + " by " + message.author.tag);
                                        }
                                        else {
                                            message.author.send("An error occured. Sorry! Please try again otherwise contact the bot owner.")
                                        }
                                        mes.reply("Completed, have fun using it!")
                                    }
                                    else {
                                        message.reply("That is not a valid url!")
                                    }
                                }
                                else {
                                    message.reply("I need a discord webhook url!")
                                }
                            }
                            else {
                                message.reply(notallowed("link", message.guild.id))
                            }
                        }
                        else if (input === prefix + "links") {
                            if (await PermCheck(message, message.author, gotroleid) == true) {
                                message.reply("I will send messages in private, execute commands here.")
                                var links = await sql.getallwebhooks(message.guild.id)
                                message.author.send("All redirects for " + message.guild.name + ":")
                                for (var i = 0; i < links.length; i++) {
                                    var inbound = links[i].webhook.replace("https://discordapp.com/api/webhooks/", "http://" + discordbotlink + ":3000/")

                                    message.author.send(links[i].webhook + "\nto\n" + inbound);
                                }
                            }
                            else {
                                message.reply(notallowed("links", message.guild.id))
                            }
                        }
                        else if (input === prefix + "prefix") {
                            configcommands.setprefix(client, message, parameters);
                        }
                        else if (input === prefix + "serverinfo") {
                            // console.log(message.guild.roles);
                            roleoutput = "";
                            message.guild.roles.forEach(function (element) {
                                roleoutput = roleoutput + ", " + element.name;
                            });
                            roleoutput = roleoutput.substr(2, roleoutput.length);
                            roleoutput = roleoutput.replace("@everyone", "everyone");
                            message.reply({
                                embed: {
                                    color: 3447003,
                                    author: {
                                        name: "Server information for " + message.guild.name,
                                        icon_url: message.guild.iconURL
                                    },
                                    fields: [{
                                        name: "Generic",
                                        value: "**ID:** " + message.guild.id + "\n"
                                            + "**Members:** " + message.guild.memberCount + "\n"
                                            + "**Owner:** " + message.guild.owner.user.tag + " - " + message.guild.ownerID + "\n"
                                            + "**Region:** " + message.guild.region + "\n"
                                            + "**Created at:** " + message.guild.createdAt + "\n"
                                            + "**Verification level:** " + message.guild.verificationLevel + "\n"
                                            + "**AFK timeout:** " + message.guild.afkTimeout / 60 + " minute(s)\n"
                                            + "**Icon:** " + message.guild.iconURL + "\n"
                                    },
                                    {
                                        name: "Roles",
                                        value: roleoutput
                                    },
                                    {
                                        name: "Wora Configuration",
                                        value: "**Prefix:** " + prefix + "\n"
                                    },
                                    ],
                                    timestamp: new Date(),
                                    footer: {
                                        icon_url: client.user.avatarURL,
                                        text: discordbotlink
                                    }
                                }
                            });
                        }
                        else if (input === prefix + "help") {
                            helparray = "";
                            var list = 0
                            for (i = 0; i < commands.length / 2; i++) {
                                helparray = helparray + "**" + prefix + commands[list] + "** - " + commands[list + 1] + "\n";
                                list += 2;
                            }
                            messagearray = {
                                embed: {
                                    color: 3066993,
                                    author: {
                                        name: "Commands for " + message.guild.name,
                                        icon_url: message.guild.iconURL
                                    },
                                    fields: [
                                        {
                                            name: "Help",
                                            value: helparray
                                        }
                                    ],
                                    timestamp: new Date(),
                                    footer: {
                                        icon_url: client.user.avatarURL,
                                        text: discordbotlink
                                    }
                                }
                            };
                            //var list = 0
                            //for (i = 0; i < commands.length / 2; i++) {
                            //    messagearray.embed.fields.push(
                            //        {
                            //            name: prefix + commands[list],
                            //            // inline: true,
                            //            value: commands[list + 1]
                            //        }
                            //    )
                            //    list += 2;
                            //}
                            message.reply(messagearray);
                        }
                        else if (input === prefix + "botcontrol") {
                            configcommands.setbotcontrol(message)
                        }
                        else if ((input === prefix + "userinfo") || (input === prefix + "me")) {
                            infocommands.userinfo(client, message);
                        }
                        else {
                            GuildSpecificCommands(message);
                        }
                    }
                }
                catch (error) {
                    console.log("Error: " + error)
                }

            }
        }
    }
}
);

function GuildSpecificCommands(message) {
    var pass = false;
    for (var i = 0; i < config.specialguilds.length; i++) {
        if (message.guild.id == config.specialguilds[i]) {
            pass = true;
        }
    }
    if (pass) {
        messageParts = message.content.split(' ');
        input = messageParts[0].toLowerCase();
        parameters = messageParts.splice(1, messageParts.length);

        if (input === prefix + "credits") {
            message.reply("Try again later.")
        }
    }
}

function notallowed(command, id) {
    return "You are not allowed to use the " + prefix + command + " command."

}
function PermCheck(message, user, roleid) {
    var val = false;
    return new Promise(function (resolve, reject) {
        roletarget = parseInt(roleid);
        message.member.roles.forEach(function (element) {
            if (roletarget == parseInt(element.id)) {
                val = true;
            }
        });
        if (message.member.hasPermission("ADMINISTRATOR")) {
            val = true;
        }
        resolve(val);
    })
}


async function start() {
    var links = await sql.getsetup()
    for (var i = 0; i < links.length; i++) {
        setuplink(links[i].webhook)
    }
    sendtoadmin("Finished setup for " + links.length.toString() + " webhooks.")
}

client.login(discordtoken);

setTimeout(function () {
    start();
}, 3000);

console.log("Bot has started");
