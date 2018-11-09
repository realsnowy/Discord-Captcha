let sql = require("sqlite");
sql.open("./src/db.sqlite");

/**
 * @returns {promise} logs - sqlite promise
 */
module.exports = () => {
    let logs = sql.all("select * from logs").catch(e => console.log("An error occured: " + e));
    return logs;
};
