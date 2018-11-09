let sql = require("sqlite");
sql.open("./src/db.sqlite");

/**
 * @returns {promise} queries - sqlite promise
 */
module.exports = () => {
    let queries = sql.all("select * from queries").catch(e => console.log("An error occured: " + e));
    return queries;
};
