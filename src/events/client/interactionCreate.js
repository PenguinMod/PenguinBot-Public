const discord = require("discord.js");

const configuration = require("../../config.js");

const env = require("../../util/env-util.js");
const Utility = require("../../util/utility.js");
const DiscordUtility = require("../../util/utility-discord.js");
const CommandUtility = require("../../util/utility-command.js");

class BotEvent {
    constructor(client) {
        this.listener = "interactionCreate";
        this.once = false;

        this.client = client;
    }

    async invoke(client, state, interaction) {
        if (!interaction.isCommand()) return;
        const commandName = interaction.commandName;
        const command = state.commands[commandName];
        const commandConversion = state.slash[commandName];
    
        if (!command || !commandConversion) {
            return interaction.reply({
                content: 'This command is not supported for slash yet.',
                ephemeral: true
            });
        }
    
        // overwrite message functions for compat
        const fakeBlockedMessage = {};
        fakeBlockedMessage.reply = (textOrOptions) => {
            if (typeof textOrOptions === 'string') {
                interaction.reply({
                    content: textOrOptions,
                    ephemeral: true
                });
                return;
            }
            interaction.reply({
                ...textOrOptions,
                ephemeral: true
            });
        };
        fakeBlockedMessage.channel = interaction.channel;
        fakeBlockedMessage.guild = interaction.guild;
        fakeBlockedMessage.author = interaction.member.user;
        fakeBlockedMessage.member = interaction.member;
    
        // create the util for this command and check if blocked
        // TODO: Slash command support just sucks right now and this is an example of that. Eventually we should focus on supporting slash commands *first* and deprecate [string] args.
        const util = new CommandUtility(command, fakeBlockedMessage);
        if (await util.handleCommandBlock()) return;
        // actually use the right "message" now
        util.message = interaction;
    
        const convertedInfo = await (commandConversion.bind(command))(interaction, util, fakeBlockedMessage);
        if (convertedInfo === false) {
            return interaction.reply({
                content: 'This command is not supported for slash yet.',
                ephemeral: true
            });
        }
    
        // use converted info to invoke the command normally
        command.invoke(...convertedInfo);
    }
}

module.exports = BotEvent;