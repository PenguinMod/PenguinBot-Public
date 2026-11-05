const discord = require("discord.js");

const configuration = require("../../../config.js");

const env = require("../../../util/env-util.js");
const BotEventEmitter = require("../../../util/bot-event-emitter.js");

const BaseBotEvent = require("../../../classes/base-bot-event.js");

class BotEvent extends BaseBotEvent {
    constructor() {
        super();
        this.listener = "userSentMessage";
        this.handler = BotEventEmitter;
        this.once = false;

        this.productionOnly = true;
    }

    /**
     * @param {discord.Client} client 
     * @param {*} state 
     * @param {discord.Message} message 
     * @returns 
     */
    async invoke(message) {
        // ignore bots
        if (!message.author) return;
        if (message.author.bot) return;
        if (message.author.system) return;
        if (message.system) return;
        if (!env.getBool("MANAGE_MESSAGE_STARBOARD"))
            return;
        if (message.guild.id !== env.get("SERVER_ID"))
            return;
        if (message.channel.id !== configuration.channels.autoStars) return;
        // must be a sound, a video, or a picture
        if (message.attachments.filter(attachment => ['audio', 'video', 'image'].includes(attachment.contentType.split('/')[0])).size <= 0)
            return;
        message.react(configuration.starboardEmojis[0]);
    }
}

module.exports = BotEvent;