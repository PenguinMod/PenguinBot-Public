const BaseCommand = require("./basecommand.js");
const OptionType = require('../util/optiontype.js');
const DiscordUtility = require("../util/utility-discord.js");

class TextModifierCommand extends BaseCommand {
    constructor() {
        super();
        this.name = "textmodifier";
        this.description = `Base command for text modifiers`;
        this.attributes = {
            unlisted: false,
            permission: 0,
        };
        this.example = [
            { text: `{{prefix}}textmodifier (replying to a message)` },
        ];

        /**
         * A description for the slash command argument of text to modify.
         * @type {string}
         */
        this.textDescription = "Text to modify.";
        this.setSlashDetail();
    }

    /**
     * Sets the slash command info for this command.
     * @returns {void}
     */
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

    convertSlashCommand(interaction, util) {
        const text = `${interaction.options.getString('text')}`;
        return [interaction, text.split(' '), util];
    }

    async invoke(message, args, util) {
        if (!DiscordUtility.automodAllows(message, true))
            return message.reply("nuh uh");

        let text = '';
        if (!(message.reference && message.reference.messageId)) {
            text = args.join(' ');
        } else {
            const reply = await util.getReply();
            text = reply.content || text;
        }
        if (!text) {
            return message.reply('you needa type something');
        }

        /** @type {string} */
        let uwuText = this.modify(String(text));
        if ((typeof uwuText === 'object') && ('then' in uwuText) && ('catch' in uwuText)) {
            uwuText = await uwuText;
        }
        uwuText = String(uwuText);

        if (!DiscordUtility.automodAllows(uwuText, true)) { // dont allow bad shit
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