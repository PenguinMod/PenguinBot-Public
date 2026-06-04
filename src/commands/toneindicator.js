const OptionType = require('../util/optiontype');
const ToneMap = require('../util/ti-list');

// my bumass only knows like 3 so kinda useful for me when they talking in penguin-chat 🥱
// #jeremy-is=over-party
class Command {
    constructor() {
        this.name = "toneindicator";
        this.description = "Explains the provided tone indicator";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: false,
        };

        this.slash = {
            options: [{
                type: OptionType.STRING,
                name: 'indicator',
                required: true,
                description: 'Indicator to lookup (ex: gen, lh)'
            }]
        };

        this.alias = ['ti'];
    }

    convertSlashCommand(interaction, util) {
        interaction.author = interaction.member.user;
        // args
        const args = [];
        const text = `${interaction.options.getString('indicator')}`;
        for (const split of text.split(' ')) {
            args.push(split);
        }
        return [interaction, args];
    }

    invoke(message, args) {
        const tone = args.join(' ')
            .replace(/[^a-z]+/g, '')
            .toLowerCase();
        if (!(tone in ToneMap)) {
            return message.reply({
                content: 'No definition was found for that.',
                ephemeral: true,
            });
        }
        message.reply({
            content: `**${tone}** - ${ToneMap[tone]}`,
            ephemeral: true,
            allowedMentions: {
                parse: [],
                users: [],
                roles: [],
                repliedUser: true
            }
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;