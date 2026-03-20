const resolveEmoji = require("../../util/resolve-emoji");

class Command {
    constructor() {
        this.name = "reactionremove";
        this.description = "Removes all reactions from a message sent in any of your <#1181097377730400287>.";
        this.attributes = {
            unlisted: false,
            admin: false,
            spaceOwner: true,
        };
    }

    async invoke(message, args, util) {
        const reply = await util.getReply(message);
        if (!reply) return message.reply('You need to reply to a message to remove reactions from.');
        if (reply.channel.id !== message.channel.id) return;
        await reply.reactions.removeAll();
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;