//const Webhook = require('../Classes/Webhook.js');
//const Server = require('../Classes/Server.js');

var async = require("async");
var mysql = require('mysql');

const config = require("../settings/config.json");

var connection = mysql.createConnection({
    host: config.sql.host,
    user: config.sql.username,
    password: config.sql.password,
    database: config.sql.database
});

function print(message, override) {
    if (config.costum.debugging || override) {
        console.log(`MYSQL.JS: ${message}`);
    }
}

connection.connect(function (err) {
    if (!err) {
        print("Database is connected", true);
    } else {
        print("Error connecting database: " + err, true);
    }
});



module.exports = {
    GetAllOwners: async function () {
        var returned;
        return new Promise(function (resolve, reject) {
            connection.query(`select owner from servers;` , async function ExistCheck(err, result, fields) {
                var users = [];
                for (var i = 0; i < result.length; i++) {
                    users.push(result[i].owner);
                    print("Adding " + result[i].owner);

                }                    
                resolve(users);
                
            });
        });
    },
}