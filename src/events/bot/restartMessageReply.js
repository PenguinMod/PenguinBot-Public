const configuration = require("../../config.js");

const env = require("../../util/env-util.js");
const BotState = require("../../util/bot-state.js");
const FormatTime = require("../../util/format-time.js");
const HostUtility = require("../../util/utility-host.js");
const BaseBotEvent = require("../../classes/base-bot-event.js");

class BotEvent extends BaseBotEvent {
    constructor() {
        super();
        this.listener = "ready";
        this.once = true;
    }

    /**
     * Runs when the event is invoked
     * @returns {Promise<any>}
     */
    async invoke() {
        if (!env.getBool("USE_RESTART_MESSAGE"))
            return;

        const restartMessageId = this.state.serialized.restartMessage;
        if (!restartMessageId) return;
        const restartChannelId = this.state.serialized.restartChannel;
        if (!restartChannelId) return;

        try {
            const channel = await this.client.channels.fetch(restartChannelId);
            const message = await channel.messages.fetch(restartMessageId);
            await message.reply(`Bot has restarted; took ${FormatTime.formatTime(Date.now() - HostUtility.startMilliseconds)} to load.`);
        
            // clear the restart info
            BotState.persist("restartMessage", null);
            BotState.persist("restartChannel", null);
        } catch (err) {
            console.warn(`Failed to reply to restartMessage;`, err);
        }
    }
}

module.exports = BotEvent;
