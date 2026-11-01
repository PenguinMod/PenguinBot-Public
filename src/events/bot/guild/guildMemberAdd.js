const configuration = require("../../../config.js");

const env = require("../../../util/env-util.js");
const BaseBotEvent = require("../../../classes/base-bot-event.js");

class BotEvent extends BaseBotEvent {
    constructor() {
        super();
        this.listener = "guildMemberAdd";
        this.once = false;

        this.productionOnly = true;
    }

    /**
     * Runs when the event is invoked
     * @param {import("discord.js").GuildMember} member 
     * @returns {Promise<any>}
     */
    async invoke(member) {
        if (!env.getBool("ADD_MEMBER_ROLE_ON_JOIN"))
            return;
        if (member.guild.id !== env.get("SERVER_ID"))
            return;

        try {
            await member.roles.add(configuration.memberRole);
        } catch (err) {
            console.warn(`Failed to give the member role to ${member.id}`, err);
        }
    }
}

module.exports = BotEvent;
