const { MessageEmbed } = require("discord.js");

const env = require("../../util/env-util");
const Database = require('sync-json-database');
const ReactionMessageDB = new Database('./databases/spaces-reactionmsg.json');
const ReactionMessageUtil = require("../../util/reaction-msg-util");

class BotEvent {
    constructor(client) {
        this.listener = "messageReactionRemove";
        this.once = false;

        this.client = client;
    }

    async invoke(client, state, reaction, user) {
        // ignore bots
        if (!user) return;
        if (user.bot) return;
        if (user.system) return;

        // get all of the spaces
        const spaceIds = ReactionMessageUtil.getSpaces();
        const spaceId = spaceIds.find(spaceId => spaceId === reaction.message.channelId);
        if (!spaceId) return;

        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch {
                return;
            }
        }

        const emojiIdentifier = reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name;
        const keyword = ReactionMessageUtil.getKeywordForEmoji(spaceId, emojiIdentifier);
        if (!keyword) return;
        const messageId = ReactionMessageUtil.getMessageIdForRole(spaceId, keyword);
        if (!messageId) return;
        if (messageId !== reaction.message.id) return;

        ReactionMessageUtil.editUserInRole(spaceId, keyword, user.id, false);
        console.log("removed", user.id, "to", spaceId, keyword);
    }
}

module.exports = BotEvent;
