const Webhook = require('./Classes/Webhook.js');
const Server = require('./Classes/Server.js');
const Webserver = require('./Classes/Webserver.js');

const config = require("./Settings/config.json");
const repo = require("./Repo/Repository.js");
const OS = require('os');

const configcommands = require("./Commands/configuration.js");
const infocommands = require("./Commands/info.js");
const webhookcommands = require("./Commands/webhook.js");

configcommands.init(repo, config);
infocommands.init(repo, config, OS);
webhookcommands.init(repo, config);

var webserver;
var admins = [];

const Discord = require("discord.js");
const client = new Discord.Client();

var statusbot = config.default.prefix + "help | " + config.info.link;

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

async function SendToAdmin(message) {
    if (admins == undefined) {
        admins = await GetAdmins();
    }
    admins.forEach(function (admin) {
        admin.send(message.toString());
    });
}

function print(message, override) {
    if (config.costum.debugging || override) {
        console.log(`MAIN.JS: ${message}`);
    }
}

function initialize_misc() {
    async function GetAdmins() {
        return new Promise(function (resolve, reject) {
            config.settings.admins.forEach(async function (id) {
                var x = await client.fetchUser(id.toString());
                admins.push(x);
            });
            resolve(admins);
        });
    }

    client.on('ready', async () => {
        await GetAdmins();

        print(`Logged in as ${client.user.tag}!`, true);
        SendToAdmin(`I have been started on: ${OS.hostname()} - ${config.info.version}`);
        SendToAdmin(`Ready to serve on ${client.guilds.size} servers, for ${client.users.size} users.`);
        client.user.setActivity(statusbot);
    });

    client.on('guildCreate', async guild => {
        SendToAdmin(`Connected to a discord: ${guild.name} - ${guild.memberCount} members`);
    });

    client.on('guildDelete', async guild => {
        SendToAdmin(`Disconnected from a discord: ${guild.name} - ${guild.memberCount} members`);
    });
}

function initialize_main() {
    var contacts = "";
    config.settings.admins.forEach(async function (admin) {
        contacts += " or <@" + admin + ">";
    });

    client.on('message', async message => {
        if (message.author != client.user) {
            if (message.channel.type === 'dm') {
                message.reply(`Hi! I have no functioning commands here. If you want to talk about me contact${contacts}. Or to add me visit ${config.info.invitelink}`);
            }

            else {
                if (message.guild.available) {
                    const user = message.author;

                    var out = await repo.GetWebhooksFromServer(await message.guild.id);
                    if (out == null) {//id,servername,members,prefix,owner
                        print("Creation of record: " + await repo.CreateServer(message.guild.id, message.guild.name, message.guild.memberCount, config.default.prefix, message.guild.ownerID, message.guild.region), true);
                    }
                    else {
                        repo.UpdateServer(message.guild.id, message.guild.name, message.guild.memberCount, await message.guild.ownerID, message.guild.region);
                    }
                    try {
                        if (user.tag !== client.user.tag) {
                            print("[" + message.guild.name + "]" + message.author.tag + " - " + message.content);

                            var messageParts = message.content.split(' ');
                            var input = messageParts[0].toLowerCase();
                            var parameters = messageParts.splice(1, messageParts.length);

                            var prefix = await repo.GetPrefix(message.guild.id);
                            var roleid = await repo.GetValue(message.guild.id, "PermRole");
                            if (input.charAt(0) == prefix) {
                                var command = input.substr(1);
                                if (command === prefix + "ping") {
                                    infocommands.ping(client, message);
                                }
                                else if (command === "you") {
                                    infocommands.botinfo(client, message);
                                }
                                else if (command === "deletelink") {
                                    webhookcommands.deletelink(client, message);
                                }
                                else if (command === "link") {
                                    try {
                                        if (await PermCheck(message, message.author, roleid) == true) {
                                            if (parameters.length != 0) {
                                                if (!parameters[0].includes(config.costum.discordwebhookurl)) {
                                                    message.reply("That is not a valid url!");
                                                    return;
                                                }
                                            }
                                            else {
                                                message.reply("I need a discord webhook url!");
                                                return;
                                            }

                                            var mes = message;
                                            try {
                                                message.delete();
                                            }
                                            catch (err) {
                                                message.reply("I couldn't delete your message. Please remove it yourself.\n Error: " + err.message);
                                            }

                                            message.reply("I will send messages in private, execute commands here.");

                                            mes.author.send("Give me a moment. I am setting up the redirect for " + parameters[0]);

                                            var link = await webserver.setuplink(new Webhook("NEWWEBHOOK", parameters[0], new Server(message.guild.id)));
                                            if (link != undefined) {
                                                var tick = await repo.CreateWebhook(mes.guild.id, parameters[0]);

                                                if (tick != "Couldn't create record!") {
                                                    mes.author.send("Finished and completed setup. You can use this webhook: " + link);
                                                    SendToAdmin("A webhook has been created in the following guild: " + message.guild.name + " by " + message.author.tag);
                                                }
                                                else {
                                                    message.author.send("An error occured. Sorry! Please try again otherwise contact the bot owner.")
                                                }
                                                mes.reply("Completed, have fun using it!");
                                            }
                                            else {
                                                message.author.send("An error occurred setting up your webhook");
                                            }

                                        }
                                        else {
                                            message.reply(notallowed("link", message.guild.id));
                                        }
                                    }
                                    catch (err) {
                                        print(err.message);
                                        message.reply("An error occured while setting this up for you. Please try again. \n Error: " + err.message);
                                    }
                                }
                                else if (command === "links") {
                                    if (await PermCheck(message, message.author, roleid) == true) {
                                        message.reply("I will send messages in private, execute commands here.");
                                        var links = await repo.GetWebhooksFromServer(message.guild.id);
                                        message.author.send("All redirects for " + message.guild.name + ":");
                                        for (var i = 0; i < links.length; i++) {
                                            var inbound = links[i].webhook.replace("https://discordapp.com/api/webhooks/", "http://" + config.info.link + ":3000/")

                                            message.author.send(links[i].webhook + "\nto\n" + inbound);
                                        }
                                    }
                                    else {
                                        message.reply(notallowed("links", message.guild.id))
                                    }
                                }
                                else if (command === "prefix") {
                                    configcommands.setprefix(client, message, parameters);
                                }
                                else if (command === "serverinfo") {
                                    infocommands.serverinfo(client, message);
                                }
                                else if (command === "help") {
                                    helparray = "";
                                    var list = 0;
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
                                                text: config.info.link
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
                                else if (command === "botcontrol") {
                                    configcommands.setbotcontrol(message, parameters);
                                }
                                else if ((command === "userinfo") || (command === "me")) {
                                    infocommands.userinfo(client, message, parameters);
                                }
                                else {
                                    GuildSpecificCommands(message);
                                }
                            }
                        }
                    }
                    catch (error) {
                        print("Error: " + error);
                    }

                }
            }
        }
    }
    );
}

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

async function Start_Webserver() {
    webserver = new Webserver(config.webserver.link, config.webserver.port, config.webserver.legacylink);
    var webhooks = await repo.GetAllWebhooks();

    webhooks.forEach(function (item, err) {
        webserver.setuplink(item);
    });

    SendToAdmin("Finished setup for " + webhooks.length.toString() + " webhooks.");
}

async function Start_Bot() {
    await initialize_misc();
    await client.login(config.token.discord);
    print("Bot has started", true);
    initialize_main();

    //  Start_Webserver();

}

Start_Bot();



//setTimeout(function () {
//    StartWebserver();
//}, 3000);



