const discord = require("discord.js");

class Command {
    constructor(client) {
        this.name = "ping";
        this.description = "Get the response time of the bot.";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };

        /**
         * @type {discord.Client}
         */
        this.client = client;
    }

    async invoke(message) {
        message.reply({
            content: `Ping: ${this.client.ws.ping}ms`
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;