const config = require("./Settings/config.json");
const db = require("./Context/" + config.SQL.Type + ".js");


module.exports = {
    GetData: function (what, where, target) {
        return await db.GetData(what, where, target);
    },

    GetWebhooksFromServerID: function (serverid) {
        return await db.GetWebhooksFromServerID(serverid);
    },

    GetServerFromWebhook: function (webhook) {
        return await db.GetServerFromWebhook(webhook);
    }
}