const Database = require('sync-json-database');
const ReactionMessageDB = new Database('./databases/spaces-reactionmsg.json');
const ReactionMessageUtil = require("../../util/reaction-msg-util");

const tryCatch = require('../../util/try-catch');

class Command {
    constructor() {
        this.name = "reactiondelete";
        this.description = "Deletes a reaction role in your <#1181097377730400287>.";
        this.attributes = {
            unlisted: false,
            admin: false,
            spaceOwner: true,
        };
    }

    async invoke(message, args, util) {
        const keyword = args[0];
        if (!keyword) return message.reply("Specify which role to delete. This is the keyword used to ping the role.");

        const messageId = ReactionMessageUtil.getMessageIdForRole(message.channel.id, keyword);
        const emoji = ReactionMessageUtil.getEmojiForKeyword(message.channel.id, keyword);
        const collectorMessage = await message.channel.messages.fetch(messageId);

        ReactionMessageUtil.removeCollector(collectorMessage);
        ReactionMessageUtil.removeRole(message.channel.id, keyword);

        // we dont really care that much
        tryCatch(async () => {
            const reaction = await collectorMessage.reactions.resolve(emoji);
            reaction.remove();
        });

        message.reply("Deleted the role. Reactions may be left over, but they will not do anything.");
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;