const config = require("../Settings/config.json");
const db = require("../Context/" + config.sql.type + ".js");


module.exports = {
    GetAllOwners: async function () {
        return await db.GetAllOwners();
    },
}