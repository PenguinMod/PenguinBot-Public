const ToneMap = require('../util/ti-list.js');
const OptionType = require('../util/optiontype.js');
const BaseCommand = require("../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "toneindicator";
        this.description = "Names the provided tone indicator";
        this.descriptionLong = "Names the provided tone indicator."
            + "\n" + '"93% of someone\'s liking of what you say comes from what you do non-verbally, and we often don\'t have access to these non-verbal cues online."'
            + "\n" + '"It can be difficult for neurodivergent people to understand you even in face-to-face, where they do have access to non-verbal cues, so imagine how much harder it is online."'
            + "\n" + "See [toneindicators.carrd.co](https://toneindicators.carrd.co/#faq) for more information.";
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