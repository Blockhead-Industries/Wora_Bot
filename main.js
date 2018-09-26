const config = require("./Settings/config.json");
const repo = require("./Repo/Repository.js");

const OS = require('os');
const Discord = require("discord.js");
const client = new Discord.Client();

var admins = [];

function print(message) {
    console.log(message);
}

async function SendToAdmin(message) {
    if (admins == undefined) {
        admins = await GetAdmins();
    }
    admins.forEach(function (admin) {
        admin.send(message);
    });
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
        var k = await repo.GetAllOwners();
        for (var i = 0; i < k.length; i++) {
            print("got "+ k[i]);
        }
        for (var i = 0; i < admins.length; i++) {
            SendToAdmin(`Sent message to: <@${k[i]}>`);
            admins[i].send("Hi, this is the developer of Wora speaking (<@124928188647211009>). \n \n A few months ago WIJ has gone on hiatus. We decides to keep Wora online for an uncertain amount of time. \n In the meantime months before this decision was made I had already left WIJ (and roblox) to focus on everything else. I did continue the maintenance on WORA and up until 2 days ago I was working on version 1.3 (which included a redesign of the horrible usability of Wora). (if you want it an unfinished version it is on github) \n Anyway lets just get straight to the point **Wora is shutting down within the next week**. \n\n The server that Wora runs on is gonna shutdown soon due to recent decisions made by us. \n \n BUT GOOD NEWS! I do have an replacement for you. You can change the `http://wijalliance.info:3000` to `https://https://discord.osyr.is/api/webhooks/` for your webhooks to keep functioning. This has been made by another roblox developer that does the same thing as wora does but simpler as it doesnt require setup in discord. \n https://devforum.roblox.com/t/discord-integration-a-guide-on-using-discord-through-roblox-updated/47090?page=4 \n \n So yeah, thats it. It was fun but yeah. For questions you can contact me (<@124928188647211009>) but otherwise. It was a good run.\n\n Have a nice day. \n\n ~Wora \n ~Enes");
        };
    });

    client.on('guildCreate', async guild => {
        SendToAdmin(`Connected to a discord: ${guild.name} - ${guild.memberCount} members`);
    });

    client.on('guildDelete', async guild => {
        SendToAdmin(`Disconnected from a discord: ${guild.name} - ${guild.memberCount} members`);
    });
}

async function Start_Bot() {
    await initialize_misc();
    await client.login(config.token.discord);
    print("Bot has started", true);


}

Start_Bot();





