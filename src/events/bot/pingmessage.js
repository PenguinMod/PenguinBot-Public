const Database = require("sync-json-database");
const PingResponseDB = new Database("./databases/ping-responses.json");
const PingResponseChannelsDB = new Database("./databases/ping-res-channels.json");

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
        // try ping message. if we are in a dm then it doesnt matter & we must actually have mentions stuff
        const canHandlePingMsg = !message.system && message.guild && message.mentions && message.mentions.members;
        const isTestingInPublic = this.isInTestMode && !(configuration.servers.testing.includes(message.guildId));
        if (!canHandlePingMsg) return;
        if (isTestingInPublic) return;
        const firstMention = message.mentions.members.first();
        if (!firstMention) return;

        // see if we are replying to a user. We dont show ping responses on replies because it can spam chat quickly
        let replyingUserId = null;
        const replyMessage = await DiscordUtility.getReply(message);
        if (replyMessage) {
            replyingUserId = replyMessage.author.id;
        }

        // Build text for all mentions here
        let text = '';
        const loopMembers = message.mentions.members.values();
        for (const member of loopMembers) {
            const userId = member.id;
            if (userId === replyingUserId) continue;
            if (!PingResponseDB.has(`${userId}`)) continue;

            if (PingResponseChannelsDB.has(`${userId}`)) {
                const { type, channels } = PingResponseChannelsDB.get(`${userId}`);
                const isInChannels = channels.includes(message.channel.id) ||
                    channels.includes(message.channel.parentId);
                if (type === 'blacklist' && !isInChannels) continue;
                // always assume whitelist if its not a blacklist
                if (type !== 'blacklist' && isInChannels) continue;
            }

            const response = PingResponseDB.get(`${userId}`) || '';
            text += `-# **${member.user.tag}** currently has a message for people who ping them.\n${response}\n`;
        }

        if (!text) return;
        message.reply({
            content: text.substring(0, 2000),
            allowedMentions: {
                parse: [],
                users: [],
                roles: [],
                repliedUser: true
            }
        });
    }
}

module.exports = BotEvent;
