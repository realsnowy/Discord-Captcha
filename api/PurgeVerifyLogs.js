let sql = require("sqlite");
sql.open("./src/db.sqlite");

module.exports = () => {
    sql.run("delete from logs").catch(e => console.log("[PurgeVerifyLogs] An error occured: " + e));
};
