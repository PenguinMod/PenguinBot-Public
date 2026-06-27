const { mathEvaluateThread } = require("../util/math-evaluate.js");
const OptionType = require('../util/optiontype');

class Command {
    constructor() {
        this.name = "calc";
        this.description = "Evaluate a mathematical expression.";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };
        this.slash = {
            options: [{
                type: OptionType.STRING,
                name: 'expression',
                required: true,
                description: 'A mathematical expression.'
            }]
        };
    }

    convertSlashCommand(interaction) {
        const text = `${interaction.options.getString('expression')}`;
        return [interaction, text.split(' ')];
    }

    async invoke(message, args) {
        const expression = args.join(' ');
        try {
            const answer = await mathEvaluateThread(expression);
            message.reply({
                content: `\`\`\`${answer}\`\`\``.substring(0, 2000),
                allowedMentions: { // ping NO ONE. this can DEFINETLY be abused if we did allow pings
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: true
                }
            });
        } catch (err) {
            console.error(err);
            message.reply("Sorry, I couldn't calculate that expression.");
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;