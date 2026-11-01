const configuration = require("../../config.js");

const env = require("../../util/env-util.js");
const ReactionMessageUtil = require("../../util/reaction-msg-util.js");

const BaseBotEvent = require("../../classes/base-bot-event.js");

class BotEvent extends BaseBotEvent {
    constructor() {
        super();
        this.listener = "ready";
        this.once = true;

        this.productionOnly = true;
    }

    /**
     * Runs when the event is invoked
     * @returns {Promise<any>}
     */
    async invoke() {
        if (!env.getBool("USE_SPACES_REACTION_ROLES"))
            return;

        // spaces reaction messages
        try {
            await ReactionMessageUtil.handleStartup(this.client);
        } catch (err) {
            const mainChannel = await this.client.channels.fetch(configuration.channels.botTestingChannel);
            mainChannel.send(`Failed to handle ReactionMessageUtil.handleStartup(). Listing spaces that failed.\n\n${err}`.substring(0, 2000));
            console.warn(err);
        }
    }
}

module.exports = BotEvent;
