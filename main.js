const config = require("./config.json");
const sql = require("./sql.js");

const Discord = require("discord.js");
const client = new Discord.Client();
const discordtoken = config.discordtoken;

const OS = require('os');
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


client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    sendtoadmin("I have been started on: " + OS.hostname() + " - " + botver);
    sendtoadmin(`Ready to serve on ${client.guilds.size} servers, for ${client.users.size} users.`);
    client.user.setActivity(statusbot);
});

client.on('guildCreate', async guild => {
    console.log(`Added to a discord: ` + guild.name + " - " + (guild.memberCount - 1) + " members");
    sendtoadmin(`Added to a discord: ` + guild.name + " - " + (guild.memberCount - 1) + " members");
});

client.on('guildDelete', async guild => {
    console.log(`Removed from a discord: ` + guild.name + " - " + (guild.memberCount) + " members");
    sendtoadmin(`Removed from a discord: ` + guild.name + " - " + (guild.memberCount) + " members");
}); 

function getadminuser() {
    return new Promise(async function (resolve, reject) {
        console.log("getting admin user.")
        resolve(await client.fetchUser(config.adminuser));
    })
}

var admin;
async function sendtoadmin(message) {
    console.log(admin);
    if (admin==undefined) {
        console.log("Getting admin user");
        admin = await getadminuser();
    }
    console.log("Sending message: " + message.toString());
    admin.send(message.toString());
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
                if (xhr.statusCode != undefined && !(xhr.statusCode === 204)) return res.send("Discord API returned an error.");
                if (!req.body.content.length) {
                    sendtoadmin("Being triggered without data by: " + target);
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
    if (message.channel.type === 'dm' && message.author != client.user) { //dm
        message.reply("Hi! I have no functioning commands here. If you want to talk about me contact @Enes#0618")
    }
    else if (message.author != client.user && message.guild.available) {
        const user = message.author;
        sql.getserver(message.guild.id).then(out => {
            if (out == false) {//id,servername,members,prefix,owner
                console.log("Creation of record: " + sql.create(message.guild.id, message.guild.name, message.guild.memberCount, defaultprefix, message.guild.owner.user.tag, message.guild.region));
            }
            else {
                sql.update(message.guild.id, message.guild.name, message.guild.memberCount, message.guild.owner.user.tag, message.guild.region) //async
            }
        });
        const permmember = await message.channel.permissionsFor(client.user);
        try {
            console.log("[" + message.guild.name + "]" + message.author.tag + " - " + message.content);
            if (user != client.user && permmember.has("SEND_MESSAGES")) {
                messageParts = message.content.split(' ');
                input = messageParts[0].toLowerCase();
                parameters = messageParts.splice(1, messageParts.length);
                prefix = await sql.getprefix(message.guild.id);
                gotroleid = await sql.getvalue(message.guild.id, "PermRole");
                if (input === prefix + "ping") {
                    message.reply('My ping to discord is ' + client.ping + ' ms.');
                }
                else if (input === prefix + "you") {
                    message.reply({
                        embed: {
                            color: 3447003,
                            author: {
                                name: "Bot information for " + client.user.tag + "",
                                icon_url: client.user.avatarURL
                            },
                            fields: [{
                                name: "Generic",
                                value:
                                    "Uptime: " + Math.floor(((client.uptime / 1000.0) / 60 / 60), 1) + " hour(s)\n"
                                    + "Running on: " + client.guilds.size + " servers\n"
                                    + "Running for: " + client.users.size + " online users\n" + "\n"
                                    + "Github: " + config.github
                            },
                            {
                                name: "Version " + botver,
                                value: versioninfo
                            },
                            {
                                name: "Back-end info",
                                value:
                                    "Current server: " + OS.hostname() + "\n"
                            }
                            ],
                            timestamp: new Date(),
                            footer: {
                                icon_url: client.user.avatarURL,
                                text: discordbotlink
                            }
                        }
                    });
                }
                else if (input === prefix + "deletelink") {
                    if (await PermCheck(message, message.author, gotroleid) == true) {
                        if (parameters.length != 0) {
                            if (parameters[0].includes("https://discordapp.com/api/webhooks/")) {
                                message.reply("I will send messages in private, execute commands here. I deleted your message to ensure our safety!")
                                var mes = message;
                                message.delete()
                                mes.author.send("Deleting " + parameters[0])
                                var k = await sql.delete(parameters[0])
                                message.reply(k)
                                mes.author.send(k)
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
                        message.reply(notallowed("prefix", message.guild.id))
                    }
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
                    if (await PermCheck(message, message.author, gotroleid) == true) {
                        if (parameters.length != 0) {
                            //prefixset[message.guild.id] = parameters[0];
                            sql.setprefix(message.guild.id, parameters[0])
                            message.reply("Changed the prefix from " + prefix + " to " + parameters[0] + ".");
                        }
                    }
                    else {
                        message.reply(notallowed("prefix", message.guild.id))
                    }
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
                    if (message.member.hasPermission("ADMINISTRATOR")) {
                        if (parameters[0] != ("" || undefined)) {
                            bigpara = "";
                            for (var i = 0; i < parameters.length; i++) {
                                bigpara = bigpara + " " + parameters[i]
                            }
                            bigpara = bigpara.substr(1, bigpara.length);
                            var found = false;
                            var roleid = 0;
                            var rolename = "";
                            message.guild.roles.forEach(function (element) {
                                if (element.name == bigpara) {
                                    found = true;
                                    roleid = element.id;
                                    rolename = element.name;
                                }
                            });
                            if (found == true) {
                                if (await sql.updatevalue(message.guild.id, "PermRole", roleid)) {
                                    message.reply("I have set the role " + rolename + " to control me.");
                                }
                                else {
                                    message.reply("An error occured while setting this role. Try again later.");
                                }
                            }
                            else {
                                message.reply("I couldn't find that role ;(");
                            }
                        }
                        else {
                            roleid = 0;
                            rolename = "";
                            message.guild.roles.forEach(function (element) {
                                if (element.id == gotroleid) {
                                    found = true;
                                    roleid = element.id;
                                    rolename = element.name;
                                }
                            });
                            if (roleid != 0) {
                                message.reply("The role that can control me is " + rolename + ".");
                            }
                            else {
                                message.reply("No role has been set to control me. qq");
                            }
                        }
                    }
                    else {
                        message.reply("Sorry, you need the Administrator permission to change this.");
                    }
                }
                else if ((input === prefix + "userinfo") || (input === prefix + "me")) {
                    auser = message.author.id;
                    if (parameters[0] != (undefined)) {
                        dothis = parameters[0];
                        dothis = dothis.replace("<@!", "");
                        dothis = dothis.replace("<@", "");
                        auser = dothis.replace(">", "");
                    }
                    gotuser = await client.fetchUser(auser);
                    gotmember = await message.guild.fetchMember(gotuser);
                    try {
                        presencetable = {};
                        if (gotuser.presence.game == undefined) {
                            presencetable = {
                                name: "Status",
                                value: "\n" + "**Presence:** " + gotuser.presence.status
                            };
                        }
                        else if (gotuser.presence.game.streaming == false) {
                            presencetable = {
                                name: "Status",
                                value: "\n" + "**Presence:** " + gotuser.presence.status +
                                "\n" + "**Current game:** " + gotuser.presence.game.name
                            };
                        }
                        else {
                            presencetable = {
                                name: "Status",
                                value: "\n" + "**Presence:** " + gotuser.presence.status +
                                "\n" + "**Current game:** " + gotuser.presence.game.name +
                                "\n" + "**Streaming:** " + gotuser.presence.game.streaming + " - " + gotuser.presence.game.url +
                                "\n" + "**Game type:** " + gotuser.presence.game.type
                            };
                        }
                        roleoutput = "";
                        gotmember.roles.forEach(function (element) {
                            roleoutput = roleoutput + ", " + element.name;
                        });
                        roleoutput = roleoutput.substr(3, roleoutput.length);
                        messagearray = {
                            embed: {
                                color: 3066993,
                                author: {
                                    name: "User information for " + gotuser.username,
                                    icon_url: gotuser.avatarURL
                                },
                                fields: [{
                                    name: "Generic",
                                    value: "**Bot**: " + gotuser.bot +
                                    "\n" + "**Tag**: " + gotuser.tag +
                                    "\n" + "**User ID**: " + gotuser.id +
                                    "\n" + "**Avatar**: " + gotuser.avatarURL +
                                    "\n" + "**Joined discord on**: " + gotuser.createdAt
                                },
                                {
                                    name: "Guild specific info",
                                    value: "**Nickname**: " + (gotmember.nickname || "None") + "\n" +
                                    "**Joined this guild on**: " + gotmember.joinedAt + "\n" +
                                    "**Strongest role**: " + gotmember.highestRole.name + "\n" +
                                    "**Server muted**: " + gotmember.serverMute + "\n" +
                                    "**Roles**: " + roleoutput
                                },

                                    presencetable
                                ],
                                timestamp: new Date(),
                                footer: {
                                    icon_url: client.user.avatarURL,
                                    text: discordbotlink
                                }
                            }
                        };
                        message.reply(messagearray);
                    }
                    catch (err) {
                        message.reply("Couldn't make an embedded post for you. Sorry!");
                    }
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
})

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
