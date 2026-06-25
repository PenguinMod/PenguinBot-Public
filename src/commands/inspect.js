const discord = require("discord.js");
const OptionType = require('../util/optiontype');

class Command {
    constructor(client) {
        this.name = "inspect";
        this.description = "View how a message's content works.";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };
        this.example = [
            { text: `{{prefix}}inspect`, image: "inspect_example1.png" }
        ];

        this.client = client;
    }

    extractContentFromReply(message) {
        if (!(message.reference && message.reference.messageId)) {
            throw new Error('Message is not a reply');
        }
        const reply = message.reference.messageId;
        return message.channel.messages.fetch(reply).then(repliedMessage => {
            if (!repliedMessage) {
                return '';
            }
            return repliedMessage.content || '';
        });
    }

    async invoke(message) {
        if (!(message.reference && message.reference.messageId)) {
            return message.reply('Reply to a message to inspect it\'s content.');
        }
        const text = await this.extractContentFromReply(message);
        const attachment = new discord.MessageAttachment(Buffer.from(text, 'utf8'), 'text.txt');
        message.reply({
            files: [attachment]
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;