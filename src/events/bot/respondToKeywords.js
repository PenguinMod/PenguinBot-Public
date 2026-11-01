const discord = require("discord.js");

const configuration = require("../../config.js");

const env = require("../../util/env-util.js");
const Utility = require("../../util/utility.js");
const DiscordUtility = require("../../util/utility-discord.js");
const CommandUtility = require("../../util/utility-command.js");
const BotEventEmitter = require("../../util/bot-event-emitter.js");
const ResponseHandler = require('../../util/response-handler.js');

const BaseBotEvent = require("../../classes/base-bot-event.js");

class BotEvent extends BaseBotEvent {
    constructor() {
        super();
        this.listener = "userSentMessage";
        this.once = false;

        this.handler = BotEventEmitter;
    }

    /**
     * Runs when the event is invoked
     * @param {import("discord.js").Message} message 
     * @returns {Promise<any>}
     */
    async invoke(message) {
        if (!env.getBool('RESPOND_TO_KEYWORDS'))
            return;
        if (!message.guild) return;
        if (!configuration.autoResponseChannels.includes(message.channel.id))
            return;
        if (!ResponseHandler.initialized)
            return;

        const content = String(message.cleanContent).toLowerCase().trim();
        if (!content) return;

        const isTestingInPublic = this.isInTestMode && !(configuration.servers.testing.includes(message.guildId));
        if (isTestingInPublic) return;

        // check for stuff we can reply to in a helpful way
        const messageOptions = ResponseHandler.matchMessage(content);
        if (!messageOptions) return;
        message.reply({
            ...messageOptions,
            allowedMentions: {
                parse: [],
                users: [],
                roles: [],
                repliedUser: true
            }
        }).catch(() => {});
    }
}

module.exports = BotEvent;
