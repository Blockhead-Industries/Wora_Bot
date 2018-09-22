var repo;
var config;

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

module.exports = {
    init: function (s, c) {
        repo = s;
        config = c;
    },

    deletelink: async function (client, message) {
        if (await PermCheck(message, message.author, gotroleid) == true) {
            if (parameters.length != 0) {
                if (parameters[0].includes("https://discordapp.com/api/webhooks/")) {
                    message.reply("I will send messages in private, execute commands here. I deleted your message to ensure our safety!")
                    var mes = message;
                    message.delete()
                    mes.author.send("Deleting " + parameters[0])
                    var k = await repo.DeleteWebhook(parameters[0])
                    message.reply(k)
                    mes.author.send(k)
                }
                else {
                    message.reply("That is not a valid discord webhook url!")
                }
            }
            else {
                message.reply("I need a discord webhook url!")
            }
        }
        else {
            message.reply(notallowed("prefix", message.guild.id))
        }
    },
}