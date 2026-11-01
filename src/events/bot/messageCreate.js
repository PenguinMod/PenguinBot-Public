const discord = require("discord.js");

const configuration = require("../../config.js");

const env = require("../../util/env-util.js");
const Utility = require("../../util/utility.js");
const DiscordUtility = require("../../util/utility-discord.js");
const CommandUtility = require("../../util/utility-command.js");
const BotEventEmitter = require("../../util/bot-event-emitter.js");

const BaseBotEvent = require("../../classes/base-bot-event.js");

class BotEvent extends BaseBotEvent {
    constructor() {
        super();
        this.listener = "messageCreate";
        this.once = false;
    }

    /**
     * Runs when the event is invoked
     * @param {import("discord.js").Message} message 
     * @returns {Promise<any>}
     */
    async invoke(message) {
        // ignore bots
        if (!message.author) return;
        if (message.author.bot) return;
        if (message.author.system) return;
        if (message.system) return;

        // ignore #spam
        if (message.channel.id === configuration.channels.spam || (message.channel.parent && message.channel.parent.id === configuration.channels.spam))
            return;

        // If this is a text command, emit userSentTextCommand
        // If this is random message, emit userSentMessage
        const prefix = this.state.prefix;
        await BotEventEmitter.ready();

        if (!message.content.startsWith(prefix)) {
            return BotEventEmitter.emit("userSentMessage", message);
        }

        // handle cmds because this is perhaps a command
        BotEventEmitter.emit("userSentTextCommand", message);
    }
}

module.exports = BotEvent;