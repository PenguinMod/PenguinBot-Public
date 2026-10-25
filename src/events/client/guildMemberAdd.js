const configuration = require("../../config");

const env = require("../../util/env-util.js");

class BotEvent {
    constructor(client) {
        this.listener = "guildMemberAdd";
        this.once = false;

        this.client = client;

        this.productionOnly = true;
    }

    /**
     * 
     * @param {import("discord.js").Client} client 
     * @param {object} state 
     * @param {import("discord.js").GuildMember} member 
     * @returns 
     */
    async invoke(client, state, member) {
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
