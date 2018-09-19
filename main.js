const Webhook = require('./Classes/Webhook.js');
const Server = require('./Classes/Server.js');
const Webserver = require('./Classes/Webserver.js');

const config = require("./Settings/config.json");
const sql = require("./Context/" + config.sql.type + ".js");
const OS = require('os');

const configcommands = require("./Commands/configuration.js");
const infocommands = require("./Commands/info.js");
const webhookcommands = require("./Commands/webhook.js");

configcommands.init(sql, config);
infocommands.init(sql, config, OS);
webhookcommands.init(sql, config);


const Discord = require("discord.js");
const client = new Discord.Client();
const discordtoken = config.token.discord;

var defaultprefix = config.default.prefix;
var botver = config.info.version;
var versioninfo = config.info.description;
var discordbotlink = config.info.link;
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

async function getuser(id) {
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

async function getadminuser() {
    return new Promise(async function (resolve, reject) {
        var result = [];
        config.settings.admins.forEach(async function (admin) {
            var x = await getuser(admin);
            result.push(x);
        });
        resolve(await result);
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
    var webserver = new Webserver(config.webserver.link, config.webserver.port, config.webserver.legacylink);
    var webhooks = await sql.getsetup();

    webhooks.forEach(function (item, err) {
        webserver.setuplink(item);
        console.log("Succesfully setup: " + item.url);
    });

    sendtoadmin("Finished setup for " + webhooks.length.toString() + " webhooks.");
}

client.login(discordtoken);

setTimeout(function () {
    start();
}, 3000);



console.log("Bot has started");
