const discord = require("discord.js");

class Command {
    constructor(client) {
        this.name = "bedel";
        this.description = "sometimes in life, you need to ping bedel, vedal's twin. which is why we have this command!";
        this.attributes = {
            unlisted: false,
            admin: false,
            lockedToCommands: true,
        };

        /**
         * @type {discord.Client}
         */
        this.client = client;
    }

    async invoke(message) {
        message.reply({
            content: `pinged <@1419269569679331358> very successfully well done on annoying <@1419269569679331358> by pinging <:good:1118293837773807657>`
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
