const math = require('mathjs');
const OptionType = require('../util/optiontype');

class Command {
    constructor() {
        this.name = "calc";
        this.description = "Evaluate a mathematical expression.";
        this.attributes = {
            unlisted: true,
            admin: true,
            lockedToCommands: true,
        };
        this.slash = {
            options: [{
                type: OptionType.STRING,
                name: 'equation',
                required: true,
                description: 'A mathematical equation.'
            }]
        };
    }

    convertSlashCommand(interaction) {
        const text = `${interaction.options.getString('equation')}`;
        return [interaction, text.split(' ')];
    }

    evaluateMath(equation) {
        // "" is undefined when evalutated
        if (equation.trim().length === 0) return 0;
        // evalueate
        let answer = 0;
        try {
            answer = math.evaluate(equation);
        } catch {
            // syntax errors cause real errors
            answer = 0;
        }
        // multiline or semi-colon breaks create a ResultSet, we can get the last item in the set for that
        if (typeof answer === "object") {
            if ("entries" in answer) {
                const answers = answer.entries;
                if (answers.length === 0) return 0;
                const lastIdx = answers.length - 1;
                return Number(answers[lastIdx]);
            }
        }
        return Number(answer);
    }

    async invoke(message, args) {
        const equation = args.join(' ');
        const answer = this.evaluateMath(equation);
        message.reply({
            content: `\`\`\`${answer}\`\`\``.substring(0, 2000),
            allowedMentions: { // ping NO ONE. this can DEFINETLY be abused if we did allow pings
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