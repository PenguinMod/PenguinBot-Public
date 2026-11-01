const env = require("../util/env-util.js");
const BotState = require("../util/bot-state.js");

class BaseBotEvent {
    constructor() {
        /**
         * The event name to listen for. If PenguinBot specific, then set `handler` to BotEventEmitter.
         * @type {"applicationCommandCreate"|"applicationCommandDelete"|"applicationCommandUpdate"|"channelCreate"|"channelDelete"|"channelPinsUpdate"|"channelUpdate"|"debug"|"emojiCreate"|"emojiDelete"|"emojiUpdate"|"error"|"guildBanAdd"|"guildBanRemove"|"guildCreate"|"guildDelete"|"guildIntegrationsUpdate"|"guildMemberAdd"|"guildMemberAvailable"|"guildMemberRemove"|"guildMembersChunk"|"guildMemberUpdate"|"guildUnavailable"|"guildUpdate"|"interactionCreate"|"invalidated"|"inviteCreate"|"inviteDelete"|"messageCreate"|"messageDelete"|"messageDeleteBulk"|"messageReactionAdd"|"messageReactionRemove"|"messageReactionRemoveAll"|"messageReactionRemoveEmoji"|"messageUpdate"|"presenceUpdate"|"rateLimit"|"ready"|"roleCreate"|"roleDelete"|"roleUpdate"|"shardDisconnect"|"shardError"|"shardReady"|"shardReconnecting"|"shardResume"|"stageInstanceCreate"|"stageInstanceDelete"|"stageInstanceUpdate"|"stickerCreate"|"stickerDelete"|"stickerUpdate"|"threadCreate"|"threadDelete"|"threadListSync"|"threadMembersUpdate"|"threadMemberUpdate"|"threadUpdate"|"typingStart"|"userUpdate"|"voiceStateUpdate"|"warn"|"webhookUpdate"}
         */
        this.listener = "ready";
        /**
         * An EventEmitter to listen on. If PenguinBot specific, then set `handler` to BotEventEmitter.
         * @type {import("node:events").EventEmitter}
         */
        this.handler = BotState.client;
        /**
         * Whether or not this event only runs when the event has been fired for the first time or not.
         * @type {boolean}
         */
        this.once = false;

        /**
         * If true, then the event will not fire in test mode.
         * @type {boolean}
         */
        this.productionOnly = false;
        
        /**
         * The Discord client that holds this event.
         * @type {import("discord.js").Client}
         */
        this.client = BotState.client;
        /**
         * Arbitrary values like loaded commands and flags.
         */
        this.state = BotState.state;
    }
    /**
     * Whether or not we are running in test mode
     * @type {boolean}
     */
    get isInTestMode() {
        return !!this.state.isInTestMode;
    }

    /**
     * Runs when the event is invoked
     * @param {...*} args 
     * @returns {Promise<any>}
     */
    async invoke(...args) {
        return; // should be overridden
    }
}

module.exports = BaseBotEvent;
