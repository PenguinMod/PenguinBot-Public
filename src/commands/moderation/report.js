const OptionType = require('../../util/optiontype');
const configuration = require("../../config");

class Command {
    constructor(client) {
        this.name = "report";
        this.description = "Slash command only. Privately send a report about a user to moderators, and optionally include a screenshot.";
        this.slashdescription = "Privately send a report about a user to moderators, & optionally include a screenshot.";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };

        this.slash = {
            options: [{
                type: OptionType.USER,
                name: 'user',
                required: true,
                description: 'Choose a user to report.'
            }, {
                type: OptionType.STRING,
                name: 'reason',
                required: true,
                description: 'Why are you reporting this user?'
            }, {
                type: OptionType.BOOLEAN,
                name: 'anonymous',
                required: true,
                description: 'Would you like to be anonymous?'
            }, {
                type: OptionType.ATTACHMENT,
                name: 'image1',
                required: false,
                description: '(Optional) A screenshot to include.'
            }, {
                type: OptionType.ATTACHMENT,
                name: 'image2',
                required: false,
                description: '(Optional) A screenshot to include.'
            }, {
                type: OptionType.ATTACHMENT,
                name: 'image3',
                required: false,
                description: '(Optional) A screenshot to include.'
            }, {
                type: OptionType.ATTACHMENT,
                name: 'image4',
                required: false,
                description: '(Optional) A screenshot to include.'
            }]
        };

        this.client = client;
    }

    convertSlashCommand(interaction) {
        interaction.author = interaction.member.user;
        return [interaction, [], true];
    }

    async invoke(message, _, isSlash) {
        isSlash = isSlash === true;
        if (!isSlash) {
            message.delete();
            return message.reply({
                content: 'Please use this command as a slash command. (use /report)\nThis will hide your report from being seen in chat.',
                ephemeral: true,
            });
        }

        const adminReportChannel = this.client.channels.cache.get(configuration.channels.userReports);
        const user = message.options.getMember('user');

        const reason = message.options.getString('reason');
        const anonymous = message.options.getBoolean('anonymous');
        const authorMention = anonymous ? `(Anonymous)` : `<@${message.author.id}>`;

        const images = [
            message.options.getAttachment('image1'),
            message.options.getAttachment('image2'),
            message.options.getAttachment('image3'),
            message.options.getAttachment('image4'),
        ].filter(x => !!x).map(image => image.attachment);

        adminReportChannel.send({
            content: `${authorMention} reported <@${user.user.id}>:\n${reason}`,
            files: images,
            allowedMentions: {
                parse: [],
                users: [],
                roles: [],
                repliedUser: false
            }
        });

        // success
        message.reply({
            content: 'Your report has been submitted.',
            ephemeral: true,
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;