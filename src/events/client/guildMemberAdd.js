const configuration = require("../../config");

class BotEvent {
    constructor(client) {
        this.listener = "guildMemberAdd";
        this.once = false;

        this.client = client;
    }

    async invoke(client, state, member) {
        try {
            await member.roles.add(configuration.permissions.memberRole);
        } catch (err) {
            console.warn(`Failed to give the member role to ${member.id}`, err);
        }
    }
}

module.exports = BotEvent;
