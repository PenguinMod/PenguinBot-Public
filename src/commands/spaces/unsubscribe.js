const configuration = require("../../config");
const resolveEmoji = require("../../util/resolve-emoji");
const ReactionMessageUtil = require("../../util/reaction-msg-util");

const tryCatch = require("../../util/try-catch");

class Command {
    constructor() {
        this.name = "unsubscribe";
        this.description = "Unsubscribe from a role, or all roles of a space in <#1181097377730400287>.";
        this.attributes = {
            unlisted: false,
            admin: false,
        };
    }

    async invoke(message, args, util) {
        if (message.channel.parentId !== configuration.channels.spaces)
            return message.reply("Use this command in any <#1181097377730400287> you want to unsubscribe from.");

        const spaceId = message.channel.id;
        const specificRole = args[0];
        const roles = ReactionMessageUtil.getRoles(spaceId);
    
        /**
         * @type {import("discord.js").Message}
         */
        let notif = null;
        if (specificRole) {
            if (!roles.includes(specificRole)) {
                notif = await message.reply("That role doesn't exist."
                    + "\n" + "-# Deleting this notification shortly...");
            } else {
                const messageId = ReactionMessageUtil.getMessageIdForRole(spaceId, specificRole);
                const emoji = ReactionMessageUtil.getEmojiForKeyword(spaceId, specificRole);
                ReactionMessageUtil.editUserInRole(spaceId, specificRole, message.author.id, false);
                notif = await message.reply("Unsubscribed from that role in this space. You may have to unreact from role messages manually."
                    + "\n" + "-# Deleting this notification shortly...");

                // we dont really care that much
                tryCatch(async () => {
                    const collectorMessage = await message.channel.messages.fetch(messageId);
                    const reaction = await collectorMessage.reactions.resolve(emoji);
                    reaction.users.remove(message.author);
                });
            }
        } else {
            for (const role of roles) {
                const messageId = ReactionMessageUtil.getMessageIdForRole(spaceId, role);
                const emoji = ReactionMessageUtil.getEmojiForKeyword(spaceId, role);
                ReactionMessageUtil.editUserInRole(spaceId, role, message.author.id, false);

                // we dont really care that much
                tryCatch(async () => {
                    const collectorMessage = await message.channel.messages.fetch(messageId);
                    const reaction = await collectorMessage.reactions.resolve(emoji);
                    reaction.users.remove(message.author);
                });
            }
            notif = await message.reply("Unsubscribed from all roles in this space. You may have to unreact from role messages manually."
                + "\n" + "-# Deleting this notification shortly...");
        }

        // delete after some t9ime
        setTimeout(() => {
            notif.delete();
        }, 10000);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;