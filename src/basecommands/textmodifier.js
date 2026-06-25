const OptionType = require('../util/optiontype');

class TextModifierCommand {
    constructor(client) {
        this.name = "textmodifier";
        this.description = `Base command for text modifiers`;
        this.textDescription = "Text to modify.";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };
        this.example = [
            { text: `{{prefix}}textmodifier (replying to a message)` },
        ];
        this.setSlashDetail();

        this.client = client;
    }

    setSlashDetail() {
        this.slash = {
            options: [{
                type: OptionType.STRING,
                name: 'text',
                required: true,
                description: this.textDescription
            }]
        };
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
            return repliedMessage.cleanContent || '';
        });
    }

    convertSlashCommand(interaction, util) {
        const text = `${interaction.options.getString('text')}`;
        return [interaction, text.split(' '), util];
    }

    async invoke(message, args, util) {
        if (!util.automodAllows(message, true)) { // dont allow bad shit
            return message.reply("nuh uh");
        }

        let text = '';
        if (!(message.reference && message.reference.messageId)) {
            text = args.join(' ');
        } else {
            text = await this.extractContentFromReply(message);
        }
        if (!text) {
            return message.reply('you needa type something');
        }
        /**
         * @type {string}
         */
        let uwuText = this.modify(String(text));
        if ((typeof uwuText === 'object') && ('then' in uwuText) && ('catch' in uwuText)) {
            uwuText = await uwuText;
        }
        uwuText = String(uwuText);

        if (!util.automodAllows(uwuText, true)) { // dont allow bad shit
            return message.reply("nuh uh");
        }

        message.reply({
            content: uwuText.substring(0, 2000),
            allowedMentions: { // ping NO ONE. this can DEFINETLY be abused if we did allow pings
                parse: [],
                users: [],
                roles: [],
                repliedUser: true
            }
        });
    }
}

module.exports = TextModifierCommand;