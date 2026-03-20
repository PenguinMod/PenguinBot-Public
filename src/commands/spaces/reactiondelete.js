const Database = require('sync-json-database');
const ReactionMessageDB = new Database('./databases/spaces-reactionmsg.json');
const ReactionMessageUtil = require("../../util/reaction-msg-util");

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

        ReactionMessageUtil.removeRole(message.channel.id, keyword);
        message.reply("Deleted the role. Reactions may be left over, but they will not do anything.");
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;