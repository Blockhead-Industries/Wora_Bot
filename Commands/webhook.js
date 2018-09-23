const Webhook = require('../Classes/Webhook.js');
const Server = require('../Classes/Server.js');
const Webserver = require('../Classes/Webserver.js');

const Discord = require("discord.js");

var repo;
var config;
var print;
var SendToAdmin;

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
    });
}


function SendNotification(title, desc, info) {
    var data = [];
    data.title = title;
    data.description = desc;
    data.timestamp = `Occured at: ${new Date()}`;
    data = new Discord.RichEmbed(data);

    data.addField(`Guild: `, info.guild, false);
    data.addField(`Owner: `, `${info.owner.tag} - <@${info.owner.id}> - ${info.owner.id}`, false);
    data.addField("Webhook: ", info.webhook.url, false);
    SendToAdmin(data);
}

function UnauthorizedRequest(message) {
    var data = [];
    data.title = title;
    data.description = desc;
    data.timestamp = `Occured at: ${new Date()}`;
    data = new Discord.RichEmbed(data);

    data.addField(`Guild: `, message.guild.name, false);
    data.addField(`Request from: `, `${message.author.tag} - <@${message.author.id}> - ${message.author.id}`, false);
    data.addField("The request: ", `${message.content}`, false);
    SendToAdmin(data);
}

module.exports = {
    init: function (s, c, p, sta) {
        repo = s;
        config = c;
        print = p;
        SendToAdmin = sta;
    },

    deletelink: async function (client, message, parameters, roleid) {
        if (await PermCheck(message, message.author, roleid) == true) {
            if (parameters.length != 0) {
                if (parameters[0].includes("https://discordapp.com/api/webhooks/")) {
                    try {
                        message.delete();
                    }
                    catch (err) {
                        message.reply("I couldn't delete your message. Please remove it yourself.\n Error: " + err.message);
                    }
                    
                    message.reply("I will send messages in private, execute commands here. I deleted your message to ensure our safety!");

                    message.author.send("Looking for webhook...");
                    try {
                        var webhook = await repo.GetWebhookByUrl(parameters[0]);
                        if (webhook !== undefined && message.guild.id !== webhook.server.id) {
                            message.author.send(`Found the webhook. It has been registered under ID: ${webhook.id}. \n It will now be deleted`);
                            var k = await repo.DeleteWebhook(webhook.id);
                            if (k != undefined) {
                                var data = [];

                                data.title =`Deleted webhook for ${message.guild.name}`;
                                data.description = `On your request a webhook has been deleted.`;
                                data.timestamp = `Requested at: ${new Date()}`;
                                data = new Discord.RichEmbed(data);
                                data.addField(`Webhook - ID: ${webhook.id}`, `${webhook.url}`, true);

                                message.author.send(data);
                            }
                            else {
                                message.author.send("The webhook request for deletion doesn't exist. If this is incorrect and the problem persists please contact one of the bot owners.");
                            }
                        }
                        else if (message.guild.id !== webhook.server.id) {
                            message.reply("This webhook doesn't belong to this server. You are not allowed to delete it. The admins have been notified.");
                            UnauthorizedRequest(message.author, message.content);
                        }
                        else {
                            message.author.send("The webhook request for deletion doesn't exist. If this is incorrect and the problem persists please contact one of the bot owners.");
                        }
                    }
                    catch(error){
                        message.author.send(`Something went wrong while I tried to delete your webhook. \n Error: ${error.message}`);
                    }
                }
                else {
                    message.reply("That is not a valid discord webhook url!");
                }
            }
            else {
                message.reply("I need a discord webhook url!");
            }
        }
        else {
            message.reply(notallowed("prefix", message.guild.id));
        }
    },

    createlink: async function (client, message, parameters, webserver, roleid) {
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

                try {
                    message.delete();
                }
                catch (err) {
                    message.reply("I couldn't delete your message. Please remove it yourself.\n Error: " + err.message);
                }

                message.reply("I will send messages in private, execute commands here.");

                message.author.send("Give me a moment. I am setting up the redirect for " + parameters[0]);
                var webhook = new Webhook("NEWWEBHOOK", parameters[0], new Server(message.guild.id));
                var link = await webserver.setuplink(webhook);
                if (link != undefined) {
                    var tick = await repo.CreateWebhook(message.guild.id, parameters[0]);

                    if (tick != "Couldn't create record!") {
                        message.author.send("Finished and completed setup. You can use this webhook: " + link);
                        var info=[];
                        info.guild = `${message.guild.name} (${message.guild.id})`;
                        info.owner = `${message.author.tag} (${message.author.id})`;
                        info.webhook = webhook;
                        SendNotification("A webhook has been created","Under here the details about the new webhook.",info);
                    }
                    else {
                        message.author.send("An error occured. Sorry! Please try again otherwise contact the bot owner.");
                    }
                    message.reply("Completed, have fun using it!");
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
    },

    getalllinks: async function (client, message, roleid) {
        if ((await PermCheck(message, message.author, roleid)) === true) {
            message.reply("I will send messages in private, execute commands here.");
            var links = await repo.GetWebhooksFromServer(message.guild.id);

            var data = [];

            data.title = `All redirects for ${message.guild.name}`;
            data.description = `Here we show all the redirects that you have setup for this discord. \n The ID shown is used for troubleshooting with the bot owner. This is mostly irrelevant for you.`;
            data.timestamp = `Requested at: ${new Date()}`;
            data = new Discord.RichEmbed(data);

            for (var i = 0; i < links.length; i++) {
                var webhook = links[i];
                var info = `${webhook.url}\n Redirected to \n ${webhook.usedurl}`;
                data.addField(`Webhook - ID: ${webhook.id}`, info, true);
            }


            message.author.send(data);


            //var links = await repo.GetWebhooksFromServer(message.guild.id);
            //message.author.send("All redirects for " + message.guild.name + ":");
            //for (var i = 0; i < links.length; i++) {
            //    var inbound = links[i].webhook.replace("https://discordapp.com/api/webhooks/", "http://" + config.info.link + ":3000/")

            //    message.author.send(links[i].webhook + "\nto\n" + inbound);
            //}
        }
        else {
            message.reply(notallowed("links", message.guild.id))
        }
    }
}