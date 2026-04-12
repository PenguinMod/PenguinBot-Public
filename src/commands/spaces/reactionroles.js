const configuration = require("../../config");
const resolveEmoji = require("../../util/resolve-emoji");
const ReactionMessageUtil = require("../../util/reaction-msg-util");
const env = require("../../util/env-util");

class Command {
    constructor() {
        this.name = "reactionroles";
        this.description = "See all of the roles available in any <#1181097377730400287>.";
        this.attributes = {
            unlisted: false,
            admin: false,
        };
    }

    makeLink(spaceId, messageId) {
        const serverId = env.get("SERVER_ID");
        return `https://discord.com/channels/${serverId}/${spaceId}${messageId ? `/${messageId}` : ""}`;
    }
    async invoke(message, args, util) {
        if (message.channel.parentId !== configuration.channels.spaces)
            return message.reply("Use this command in any <#1181097377730400287> you want to view roles for.");

        const spaceId = message.channel.id;
        const roles = ReactionMessageUtil.getRoles(spaceId);
        if (roles.length <= 0) return message.reply("There are no roles in this space.");

        const fullDetail = `Available roles: ${roles.map(role => `**${role}** (${this.makeLink(spaceId, ReactionMessageUtil.getMessageIdForRole(spaceId, role))})`).join(", ")}`;
        message.reply({
            content: fullDetail.substring(0, 2000),
            allowedMentions: { // ping NO ONE. this can DEFINETLY be abused if we did allow pings
                parse: [],
                users: [],
                roles: [],
                repliedUser: true
            }
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;