let sql = require("sqlite");
sql.open("./src/db.sqlite");

/**
 * @param {object} message - The message object
 * @param {object} config - The config object
 */

module.exports = (message, config) => {
	if(!message.member.roles.has(config.userrole)) return message.reply("you are not verified yet.");
	message.member.removeRole(config.userrole).catch(e => console.log(e)).then(() => message.reply("unverified!"));
};
