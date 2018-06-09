<a href="https://david-dm.org/enessene/wora" title="dependencies status"><img src="https://david-dm.org/enessene/wora/status.svg"/></a>
# Wora
The webhook bot. The bot allows you to create webhook redirects through discord commands.

### Required to make this bot work
* node.js
* Mysql server

### config.json
To run this bot you are requires to have a config.json file in the root. This makes the bot compatible with older versions of itself (since 0.6).
This is current how the config is structured. To make the bot work you need to create this file and fill in the information listed below.

```
{
  "discordtoken": "",
  "defaultprefix": "!",
  "botver": "",
  "versioninfo": "",
  "github": "",
  "botlink": "",
  "specialguilds": [  ],

  "admins": [ "" ],
  
  "SQLHost": "",
  "SQLDatabase": "",
  "SQLUsername": "",
  "SQLPassword": ""

}
```
