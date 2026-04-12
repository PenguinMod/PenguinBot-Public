const Database = require('sync-json-database');
const ReactionMessageDB = new Database('./databases/spaces-reactionmsg.json');
const ReactionMessageUtil = require("../../util/reaction-msg-util");

class Command {
    constructor() {
        this.name = "reactionping";
        this.description = "Pings a reaction role in your <#1181097377730400287>.";
        this.attributes = {
            unlisted: false,
            admin: false,
            spaceOwner: true,
        };

        this.cooldownSpaces = {};
    }

    buildString(users) {
        return users.map(id => `<@${id}>`).join('');
    }
    async invoke(message, args, util) {
        const spaceId = message.channel.id;
        const reply = await util.getReply(message);
        if (!reply) return message.reply('You need to reply to a message. Subscribers will be linked to the replied message upon ping.');
        if (reply.channel.id !== spaceId) return;

        const keyword = args[0];
        if (!keyword) return message.reply("Specify which role to ping. This is the keyword used to create the role.");
        if (this.cooldownSpaces[spaceId + keyword] > Date.now())
            return message.reply(`You are pinging this role too fast. You can ping them again <t:${Math.round(this.cooldownSpaces[spaceId + keyword] / 1000)}:R>.`);

        const users = ReactionMessageUtil.getUsersOfRole(spaceId, keyword);
        if (users.length <= 0) return message.reply("No users subscribed to that role. (does it exist?)");

        // have a cool down for invokes
        this.cooldownSpaces[spaceId + keyword] = Date.now() + (5 * 60 * 1000);
        
        // 2000 character boundary to be safe and staying safe under 95 pings
        const chunkSize = 90;
        for (let i = 0; i < users.length; i += chunkSize) {
            const chunk = users.slice(i, i + chunkSize);
            const pingString = this.buildString(chunk);

            const sentMessage = await reply.reply({
                content: pingString
            });
            
            // edit after to show the message link
            const messageLink = util.makeMessageLink(reply);
            await sentMessage.edit(`Subscribers, see ${messageLink} [(or the replied message)](${messageLink})`
                + "\n" + `-# *(${chunk.length} users pinged for **${keyword}**)*`);
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;