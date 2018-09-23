var repo;
var config;
var OS;
const Discord = require(`discord.js`);

module.exports = {
    init: function (s, c, os) {
        repo = s;
        config = c;
        OS = os;
    },

    ping: async function (client, message) {
        message.reply('My ping to discord is ' + client.ping + ' ms.');
    },

    botinfo: async function (client, message) {
        message.reply({
            embed: {
                color: 3447003,
                author: {
                    name: `Bot information for ${client.user.tag}`,
                    icon_url: client.user.avatarURL
                },
                fields: [{
                    name: `Generic`,
                    value:
                        `Uptime: ${Math.floor(((client.uptime / 1000.0) / 60 / 60), 1)} hour(s) \n` +
                        `Running on: ${client.guilds.size} servers \n` +
                        `Running for: ${client.users.size} online users \n` +
                        `Github: ${config.info.github}`
                },
                {
                    name: `Version ${config.info.version}`,
                    value: (`${config.info.description}` || `No info for this version.`)
                },
                {
                    name: `Back-end info`,
                    value: `Current server: ${OS.hostname()}`
                }
                ],
                timestamp: new Date(),
                footer: {
                    icon_url: client.user.avatarURL,
                    text: config.info.link
                }
            }
        });
    },

    userinfo: async function (client, message, parameters) {
        auser = message.author.id;
        if (parameters[0] != (undefined)) {
            dothis = parameters[0];
            dothis = dothis.replace(`<@!`, ``);
            dothis = dothis.replace(`<@`, ``);
            auser = dothis.replace(`>`, ``);
        }
        gotuser = await client.fetchUser(auser);
        gotmember = await message.guild.fetchMember(gotuser);
        try {
            presencetable = {};
            if (gotuser.presence.game == undefined) {
                presencetable = {
                    name: `**Presence:** ${gotuser.presence.status}`,
                    value: "Not streaming."
                };
            }
            else if (gotuser.presence.game.streaming == false) {
                presencetable = {
                    name: `**Presence:** ${gotuser.presence.status} `,
                    value: `**Current game:** ${gotuser.presence.game.name}`
                };
            }
            else {
                presencetable = {
                    name: `**Presence:** ${gotuser.presence.status}`,
                    value: `** Current game:** ${gotuser.presence.game.name}\n` +
                        `**Streaming:** ${gotuser.presence.game.streaming} - ${gotuser.presence.game.url} \n` +
                        `**Game type:** ${gotuser.presence.game.type}`
                };
            }
            roleoutput = ``;
            gotmember.roles.forEach(function (element) {
                roleoutput = `${ roleoutput }, ${element.name}`;
            });
            roleoutput = roleoutput.substr(3, roleoutput.length);
            messagearray = {
                embed: {
                    color: 3066993,
                    author: {
                        name: `User information for ${gotuser.username}`,
                        icon_url: gotuser.avatarURL
                    },
                    fields: [{
                        name: `Generic`,
                        value: `**Bot**: ${gotuser.bot}\n` +
                            `**Tag**: ${gotuser.tag}\n` +
                            `**User ID**: ${gotuser.id}\n` +
                            `**Avatar**: ${gotuser.avatarURL}\n` +
                            `**Joined discord on**: ${gotuser.createdAt}`
                    },
                    {
                        name: `Guild specific info`,
                        value: `**Nickname**: ${(gotmember.nickname || `None`)} \n` +
                            `**Joined this guild on**: ${gotmember.joinedAt} \n` +
                            `**Strongest role**: ${gotmember.highestRole.name} \n` +
                            `**Server muted**: ${gotmember.serverMute} \n` +
                            `**Roles**: ${roleoutput}`
                    },

                        presencetable
                    ],
                    timestamp: new Date(),
                    footer: {
                        icon_url: client.user.avatarURL,
                        text: config.info.link
                    }
                }
            };
            message.reply(messagearray);
        }
        catch (err) {
            console.log(err);
            message.reply(`Couldn't make an embedded post for you. Sorry!`);
        }
    },

    serverinfo: async function (client, message) {
        var roleoutput = ``;
        message.guild.roles.forEach(function (element) {
            roleoutput = `${roleoutput}, ${element.name}`;
        });
        roleoutput = roleoutput.substr(2, roleoutput.length);
        roleoutput = roleoutput.replace(`@everyone`, `everyone`);

        var data = [];
        data.title = `Server information for ${message.guild.name}`;
        data = new Discord.RichEmbed(data);

        data.color = 3447003;
        data.thumbnail = message.guild.iconURL;
        data.timestamp = new Date();
        data.url = config.info.link;

        var generic = `**ID:** ${message.guild.id} \n` +
            `**Members:** ${message.guild.memberCount} \n` +
            `**Owner:** ${message.guild.owner.user.tag} - ${message.guild.ownerID} \n` +
            `**Region:** ${message.guild.region} \n` +
            `**Created at:** ${message.guild.createdAt} \n` +
            `**Verification level:** ${message.guild.verificationLevel} \n` +
            `**AFK timeout:** ${message.guild.afkTimeout / 60} minute(s) \n` +
            `**Icon:** ${message.guild.iconURL}\n`;
        data.addField(`Generic`, generic, false);

        data.addField(`Roles`, roleoutput, false);

        var prefix = await repo.GetPrefix(message.guild.id);
        var webhooks = (await repo.GetWebhooksFromServer(message.guild.id)).length;
        var botcontrol = await repo.GetValue(message.guild.id, "PermRole");
        var settings = `**Prefix:** ${prefix} \n` +
            `**Webhooks**: ${webhooks} \n` +
            `**BotControl:** <@&${botcontrol}>`;
        data.addField(`Server specific bot configuration`, settings, false);


        message.reply(data);
    }
}