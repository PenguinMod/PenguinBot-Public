const discord = require("discord.js");

const configuration = require("../../config.js");

const env = require("../../util/env-util.js");
const Utility = require("../../util/utility.js");
const DiscordUtility = require("../../util/utility-discord.js");
const CommandUtility = require("../../util/utility-command.js");
const CommandRegistry = require("../../util/command-registry.js");
const BotEventEmitter = require("../../util/bot-event-emitter.js");

const BaseBotEvent = require("../../classes/base-bot-event.js");

class BotEvent extends BaseBotEvent {
    constructor() {
        super();
        this.listener = "userSentTextCommand";
        this.once = false;

        this.handler = BotEventEmitter;
    }

    /**
     * Runs when the event is invoked
     * @param {import("discord.js").Message} message 
     * @returns {Promise<any>}
     */
    async invoke(message) {
        // NOTE: Preserving whitespace characters like \n is important
        const prefix = this.state.prefix;
        const messageSlice = message.content.slice(prefix.length);
        const indexOfFirstWhitespace = messageSlice.search(/\s/);
        const commandName = indexOfFirstWhitespace === -1 ? messageSlice : messageSlice.slice(0, indexOfFirstWhitespace);
        const command = CommandRegistry.commands.get(commandName) || CommandRegistry.alias.get(commandName);
        if (!command) {
            return message.reply({
                content: `Command not found. Did you mean something else?\nUse \`${prefix}help\` to see a list of commands.`,
                allowedMentions: {
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: true
                }
            });
        }
        
        // create the util for this cmmand, and see if we should block it
        const util = new CommandUtility(command, message);
        if (await util.handleCommandBlock()) return;

        // Only chop off the first whitespace character, then preserve all the rest
        const argumentsString = messageSlice.slice(commandName.length);
        const indexOfFirstNonWhitespace = argumentsString.search(/\S/);
        const textToSplit = (indexOfFirstNonWhitespace === -1 ? argumentsString : argumentsString.slice(indexOfFirstNonWhitespace));
        const split = textToSplit === "" ? [] : textToSplit.split(" ");

        // some commands can allow number conversion
        const convertNums = command.attributes.numberConversion === true;
        const args = convertNums ? split.map(arg => isNaN(Number(arg)) ? String(arg) : Number(arg)) : split;
    
        try {
            // use command now
            await command.invoke(message, args, util);
        } catch (err) {
            console.error(err);
            message.reply({
                content: `An unknown error occurred.\n${err}`.substring(0, 2000),
                allowedMentions: {
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: true
                }
            });
        }
    }
}

module.exports = BotEvent;