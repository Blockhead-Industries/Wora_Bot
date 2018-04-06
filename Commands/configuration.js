var sql;
var config;

module.exports = {
    init: function (s,c){
        sql = s;
        config = c;
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