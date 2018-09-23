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
    data.addField(`Owner: `, info.owner, false);
    data.addField("Webhook: ", info.webhook.url, false);
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
                        var webhook = await repo.GetWebhook(parameters[0]);
                        if (webhook !== undefined) {
                            message.author.send(`Found the webhook. It has been registered under ID: ${webhook.id}. \n It will now be deleted`);
                            var k = await repo.DeleteWebhook(webhook.id);
                            if (k) {
                                message.author.send(`Webhook has succesfully been deleted.`);
                            }
                            else {
                                message.author.send("Something went wrong deleting your webhook. Please try again. If the problem persists please contact one of the bot owners.");
                            }
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

                var mes = message;
                try {
                    message.delete();
                }
                catch (err) {
                    message.reply("I couldn't delete your message. Please remove it yourself.\n Error: " + err.message);
                }

                message.reply("I will send messages in private, execute commands here.");

                mes.author.send("Give me a moment. I am setting up the redirect for " + parameters[0]);
                var webhook = new Webhook("NEWWEBHOOK", parameters[0], new Server(message.guild.id));
                var link = await webserver.setuplink(webhook);
                if (link != undefined) {
                    var tick = await repo.CreateWebhook(mes.guild.id, parameters[0]);

                    if (tick != "Couldn't create record!") {
                        mes.author.send("Finished and completed setup. You can use this webhook: " + link);
                        var info=[];
                        info.guild = `${message.guild.name} (${message.guild.id})`;
                        info.owner = `${message.author.tag} (${message.author.id})`;
                        info.webhook = webhook;
                        SendNotification("A webhook has been created","Under here the details about the new webhook.",info);
                    }
                    else {
                        message.author.send("An error occured. Sorry! Please try again otherwise contact the bot owner.");
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
}