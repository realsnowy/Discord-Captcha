// Module Imports and instances
const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");
const snekfetch = require("snekfetch");
const jimp = require("jimp");
const sql = require("sqlite");
sql.open("./src/db.sqlite");

class Captcha {
    /**
     * @param {string} captcha - The captcha (pass null and call generate method if it shall be random)
     * @param {object} author - The author object (Has to has an id property and should look like <@123456789>)
     * @param {buffer} image buffer - Initialize object with an already existing image buffer
     */
    constructor(captcha, author, buff) {
        this._captcha = captcha;
    }

    /**
     * @returns {string} Captcha value of class
     */
    generate() {
        let rand = Math.random().toString(36).substr(2, 6);
        this.captcha = rand;
        return this.captcha;
    }

    get captcha() {
        return this._captcha;
    }

    set captcha(value) {
        this._captcha = value;
    }
}

// Command Imports
const config = require("./src/config.json");
const callback_ = err => {
    if (err) console.log(err);
};


let queue = [],
    latestVersion;
snekfetch.get("https://raw.githubusercontent.com/y21/discordcaptcha/master/src/config.json")
    .then(r => {
        if (JSON.parse(r.body).version != config.version) {
            console.log("### A new version of discordcaptcha is available!  (Latest: " + JSON.parse(r.body).version + ")\n\n");
        }
        latestVersion = JSON.parse(r.body).version;
    }).catch(console.log);

client.on("ready", () => {
    try {
        console.log("Logged in!");
        if (client.guilds.size > 1) {
            console.log("It looks like this bot is on more than one guild. It is recommended not to have this bot on more than one since it could do random stuff.")
        }
        client.guilds.forEach(guild => {
            if (!guild.roles.get(config.userrole)) console.log(`${guild.name} has no userrole or the snowflake that was given in the config file is invalid.`);
        });
    } catch (e) {
        console.log("[DISCORDCAPTCHA-readyEvent] >> " + e);
    }
});

client.on("warn", console.warn);
client.on("error", console.error);
client.on("disconnect", () => console.log("Bot disconnected from WebSocket!"));
client.on("reconnect", () => console.log("Reconnecting to WebSocket ..."));

client.on("message", async (message) => {
    try {
        let blocked = await sql.get('select * from blocked where id="' + message.author.id + '"');
        if (blocked) message.member.kick();
        if (message.channel.name === "verify") {
            if (message.author.id != client.user.id) message.delete();
            else setTimeout(() => message.delete(), 2500);
            if (message.content === `${config.prefix}verify`) {
                if (await sql.get('select * from queries where id="' + message.author.id + '"') || message.member.roles.has(config.userrole)) return message.reply("Already verified or in queue!");
                let captchaInstance = new Captcha(null, message.author);
                let captcha = captchaInstance.generate();
                if (config.captchaType == "image") {
                    let _image = await jimp.read("https://i.imgur.com/mkoc2Fh.png");
                    let _font = await jimp.loadFont(jimp.FONT_SANS_64_BLACK);
                    let _coordinates = [60, 0]; // x & y coordinates for text on image
                    _image.resize(310, 75); // make bigger
                    _image.print(_font, _coordinates[0], _coordinates[1], captcha); // print captcha on image
                    message.author.send(new Discord.RichEmbed()
                        .setTitle("Verification")
                        .setDescription("This guild is protected with a captcha.")
                        .addField("Instructions", `In a few seconds an image will be sent to you which includes a number. Please send ${config.prefix}verify <captcha> into the channel ${message.channel}`)
                        .setColor("0xFFFFFF")
                        .setTimestamp()
                    ).catch(e => e.toString().includes("Cannot send messages to this user") ? message.reply("please turn on dms") : null);
                    _image.getBuffer(jimp.MIME_PNG, (err, buff) => {
                        message.author.send(new Discord.Attachment(buff, "captcha.png"));
                    });
                } else if (config.captchaType == "text") {
                    message.author.send(new Discord.RichEmbed()
                        .setDescription("Paste the code below in the verify channel to get verified.")
                    );
                    message.author.send(`\`\`\`${config.prefix}verify ${captchaInstance.captcha}\`\`\``);
                }
                sql.run('insert into queries values ("' + message.author.id + '")');
                message.channel.awaitMessages(msg => msg.content === config.prefix + "verify " + captchaInstance.captcha && msg.author === message.author, {
                        max: 1,
                        errors: ["time"]
                    })
                    .then(() => {
                        let logChannel = client.channels.get(config.chat) || client.channels.find("name", config.chat);
                        if (logChannel && logChannel.type === "text") logChannel.send(`${message.author.toString()} was successfully verified.`);
                        if (config.logging) sql.run('insert into logs values ("' + message.author.id + '", "' + Date.now() + '")');
                        sql.run('delete from queries where id="' + message.author.id + '"');
                        queue.pop();
                        message.member.addRole(config.userrole1).catch(console.log);
                        message.member.removeRole(config.userrole2).catch(console.log);
                        delete captchaInstance;
                    }).catch(console.log);
            }
        }
        require("./src/Commands.js")(message, config, Discord, fs, latestVersion); // Command Handler
    } catch (e) {
        console.log(e);
    }
});
process.on("unhandledRejection", console.log);

client.login(process.env.BOT_TOKEN);
