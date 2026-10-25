const discord = require("discord.js");

const BaseCommand = require("../../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "ping";
        this.description = "Get the response time of the bot.";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };
    }

    async invoke(message) {
        message.reply({
            content: `Ping: ${this.client.ws.ping}ms`
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;