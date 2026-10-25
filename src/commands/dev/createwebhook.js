const OptionType = require("../../util/optiontype.js");
const BaseCommand = require("../../classes/basecommand.js");

const configuration = require("../../config.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "createwebhook";
        this.description = "makes webhook";
        this.attributes = {
            permission: 3,
        };
    }

    async invoke(message, args, util) {
        let webhook = await message.channel.createWebhook("Captain Hook");

        let outputChannel = await this.client.channels.cache.get(configuration.channels.botTestingChannel);
        outputChannel.send(`<@${message.author.id}> webhook for <#${message.channel.id}>: ${webhook.url}`);

        message.reply("made webhook");
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;