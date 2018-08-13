var sql;
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
        sql = s;
        config = c;
    },

    setprefix: async function (client, message, parameters) {
        if (await PermCheck(message, message.author, gotroleid) === true) {
            if (parameters.length !== 0) {
                //prefixset[message.guild.id] = parameters[0];
                var result = await sql.setprefix(message.guild.id, parameters[0]);
                console.log(result);
                if (result == true) {
                    message.reply("Changed the prefix from " + prefix + " to " + parameters[0] + ".");
                }
                else {
                    message.reply("Something went wrong while changing your prefix!");
                }
            }
        }
        else {
            message.reply(notallowed("prefix", message.guild.id));
        }
    },

    setbotcontrol: async function (message) {
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
}