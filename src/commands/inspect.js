const discord = require("discord.js");

const OptionType = require('../util/optiontype.js');
const BaseCommand = require("../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "inspect";
        this.description = "View how a message's content works.";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };
        this.example = [
            { text: `{{prefix}}inspect`, image: "inspect_example1.png" }
        ];
    }

    async invoke(message, _, util) {
        const reply = await util.getReply();
        if (!reply) return message.reply("Reply to a message to inspect its content.");

        const attachment = new discord.MessageAttachment(Buffer.from(reply.content, 'utf8'), 'text.txt');
        message.reply({ files: [attachment] });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;