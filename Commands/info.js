var sql;
var config;
var OS;

module.exports = {
    init: function (s, c, s) {
        sql = s;
        config = c;
        OS = s;
    },

    ping: async function (client, message) {
        message.reply('My ping to discord is ' + client.ping + ' ms.');
    },

    botinfo: async function (client, message) {
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
                        + "Github: " + config.info.github
                },
                {
                    name: "Version " + config.info.version,
                    value: config.info.description
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
                    text: config.info.link
                }
            }
        });
    },

    userinfo: async function (client, message) {
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
                        text: config.info.link
                    }
                }
            };
            message.reply(messagearray);
        }
        catch (err) {
            console.log(err);
            message.reply("Couldn't make an embedded post for you. Sorry!");
        }
    }
}