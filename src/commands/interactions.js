const Database = require('sync-json-database');
const DisabledInteractionsDB = new Database('./databases/disabled-interactions.json');
const OptionType = require('../util/optiontype');

class Command {
    constructor() {
        this.name = "interactions";
        this.description = "Enable or disable yourself from being used in commands that involve other users.";
        this.attributes = {};
        this.slash = {
            options: [{
                type: OptionType.STRING,
                name: 'action',
                required: true,
                description: 'Enable or disable other users using you in commands.',
                choices: [{
                    name: 'Enable',
                    value: 'enable'
                }, {
                    name: 'Disable',
                    value: 'disable'
                }]
            }]
        };
        this.alias = ["interaction"];
    }

    convertSlashCommand(interaction) {
        const action = interaction.options.getString('action');
        interaction.author = interaction.member.user;
        return [interaction, [action]];
    }
    
    invoke(message, args) {
        const userId = `${message.author.id}`;
        if (!args[0]) return message.reply(`Specify \`enable\` or \`disable\` to enable or disable yourself from being used in certain commands.
Your interactions are currently ${DisabledInteractionsDB.get(userId) ? 'disable' : 'enable'}d.`);
        // handle stuff
        const disableInteractions = args[0] === 'disable';
        DisabledInteractionsDB.set(userId, disableInteractions);
        message.reply(`Interactions have been ${disableInteractions ? 'disable' : 'enable'}d.${disableInteractions ? `
People who ping you for commands will not be able to use you or your image.` : ''}`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
