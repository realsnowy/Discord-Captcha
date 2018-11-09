module.exports = async (message, config, Discord, fs, latestVersion) => {
	let enabledCommands = [ ];

	for(const command of Object.keys(config.commands)){
		if(config.commands[command].enabled) enabledCommands.push(config.commands[command]);
	}

	if(config.evalAllowed) enabledCommands.push({ command: "eval" });

	const Handler = require("../api/Handler.js");

	let [command, ...args] = message.content.split(" ");
	command = command.substr(config.prefix.length);
	if(enabledCommands.find(e => e.command === command)){
		if(command === config.commands.blockUser.command) require("./commands/block.js")(message, config.commands.blockUser.contributors);
		if(command === config.commands.banGuildMember.command) require("./commands/ban.js")(message, config.commands.banGuildMember.contributors);
		if(command === config.commands.removeBlockFromUser.command) require("./commands/removeBlock.js")(message, config.commands.removeBlockFromUser.contributors);
		if(command === config.commands.clear.command) require("./commands/clear.js")(message, config.commands.clear.contributors);
		if(command === "eval" && message.author.id === config.ownerid && config.evalAllowed) message.channel.send(":outbox_tray: Output: ```JavaScript\n" + eval(message.content.substr(6)) + "\n```");
		if(command === config.commands.version.command) message.channel.send(new Discord.RichEmbed().setColor("RANDOM").setTitle("Version").setDescription(`Current DiscordCaptcha version: \`${config.version}\`\nLatest version: \`${latestVersion}\``).addField("Repository", "https://github.com/y21/discordcaptcha/").setTimestamp());
		if(command === config.commands.makerole.command) require("./commands/makerole.js")(message, config.commands.makerole.contributors);
		if(command === config.commands.unverify.command) require("./commands/unverify.js")(message, config);

		// Utility (aka API) commands
		if(command === config.commands.queries.command && config.commands.queries.contributors.includes(message.author.tag)) message.channel.send("```js\n// Query\n\n" + require("util").inspect(await new Handler("GetQueryEntries").request()) + "\n```");
		if(command === config.commands.querydelete.command && config.commands.querydelete.contributors.includes(message.author.tag)) {
			new Handler("DeleteQueryEntries").request();
			message.channel.send("Deleted the query.");
		}
		if(command === config.commands.purgelogs.command && config.commands.purgelogs.contributors.includes(message.author.tag)) {
			new Handler("PurgeVerifyLogs").request();
			message.channel.send("Deleted the query.");
		}
		if(command === config.commands.logs.command && config.commands.logs.contributors.includes(message.author.tag)) message.channel.send("```js\n// Logs\n\n" + require("util").inspect(await new Handler("GetLogs").request()) + "\n```");
	}
};