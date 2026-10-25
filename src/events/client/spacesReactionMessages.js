const configuration = require("../../config.js");

const env = require("../../util/env-util.js");
const ReactionMessageUtil = require("../../util/reaction-msg-util.js");

class BotEvent {
    constructor(client) {
        this.listener = "ready";
        this.once = true;

        this.client = client;

        this.productionOnly = true;
    }

    /**
     * @param {import("discord.js").Client} client 
     * @param {*} state 
     */
    async invoke(client, state) {
        if (!env.getBool("USE_SPACES_REACTION_ROLES"))
            return;

        // spaces reaction messages
        try {
            await ReactionMessageUtil.handleStartup(client);
        } catch (err) {
            const mainChannel = await client.channels.cache.get(configuration.channels.botTestingChannel);
            mainChannel.send(`Failed to handle ReactionMessageUtil.handleStartup(). Listing spaces that failed.\n\n${err}`.substring(0, 2000));
            console.warn(err);
        }
    }
}

module.exports = BotEvent;
