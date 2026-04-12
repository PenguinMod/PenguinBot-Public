const configuration = require("../../config");
const resolveEmoji = require("../../util/resolve-emoji");
const ReactionMessageUtil = require("../../util/reaction-msg-util");
const env = require("../../util/env-util");

class Command {
    constructor() {
        this.name = "subscriptions";
        this.description = "See all roles you are subscribed to in <#1181097377730400287>.";
        this.attributes = {
            unlisted: false,
            admin: false,
            lockedToCommands: true,
        };
    }

    makeLink(spaceId, messageId) {
        const serverId = env.get("SERVER_ID");
        return `https://discord.com/channels/${serverId}/${spaceId}${messageId ? `/${messageId}` : ""}`;
    }
    async invoke(message, args, util) {
        const activeRoles = [];
        const spaces = ReactionMessageUtil.getSpaces();
        for (const spaceId of spaces) {
            const roles = ReactionMessageUtil.getRoles(spaceId);
            for (const role of roles) {
                const users = ReactionMessageUtil.getUsersOfRole(spaceId, role);
                if (users.includes(message.author.id)) {
                    activeRoles.push({
                        role,
                        spaceId,
                        messageId: ReactionMessageUtil.getMessageIdForRole(spaceId, role),
                    });
                }
            }
        }

        const spacesOnly = [...new Set(activeRoles.map(role => role.spaceId))];
        const fullDetail = `Currently subscribed to ${activeRoles.map(role => `**${role.role}** (${this.makeLink(role.spaceId, role.messageId)})`).join(", ")}`;
        const spaceDetail = `Currently subscribed to ${spacesOnly.map(spaceId => `${this.makeLink(spaceId)}`).join(", ")}`;
        if (activeRoles.length <= 0) {
            return message.reply("You aren't subscribed to any roles in any <#1181097377730400287>.");
        }
        message.reply({
            content: fullDetail.length < 2047 ? fullDetail : spaceDetail,
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