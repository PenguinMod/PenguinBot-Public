const Database = require('sync-json-database');
const ReactionMessageDB = new Database('./databases/spaces-reactionmsg.json');
const ReactionMessageUtil = require("../../util/reaction-msg-util");
const resolveEmoji = require("../../util/resolve-emoji");

class Command {
    constructor(client, state) {
        this.name = "reactionmsg";
        this.description = "Allows you to create reaction roles in <#1181097377730400287>.";
        this.attributes = {
            unlisted: false,
            admin: false,
            spaceOwner: true,
        };
        this.example = [
            { text: `(Reply to a message you sent) ${state.prefix}reactionmsg 🖐️` }
        ];

        this.client = client;
    }

    async invoke(message, args, util) {
        const reply = await util.getReply(message);
        if (!reply) return message.reply('You need to reply to a message you\'ve sent.');
        if (reply.author.id !== message.author.id) return message.reply("Reaction messages must be sent by the space owner.");
        if (reply.channel.id !== message.channel.id) return;
        
        // get the emoji & keyword to use
        const rawEmoji = args.shift();
        if (!rawEmoji) return message.reply("Use a valid emoji for the reaction role.");
        const resolvedEmoji = resolveEmoji(rawEmoji, this.client);
        if (!resolvedEmoji) return message.reply("Use a valid emoji for the reaction role.");
        const emoji = resolvedEmoji.emoji || resolvedEmoji.id;
        const keyword = args.shift();
        const invalidReason = ReactionMessageUtil.getInvalidKeywordReason(keyword);
        if (invalidReason) return message.reply(invalidReason);

        // creeate entry
        const invalidCreation = ReactionMessageUtil.getNewReactionMessageInvalidReason(reply, emoji, keyword);
        if (invalidCreation) return message.reply(invalidCreation);
        ReactionMessageUtil.createRole(reply, emoji, keyword);

        // add the reaction & listen for reactions
        try {
            await reply.react(emoji);
        } catch {
            // this is kinda bad
            ReactionMessageUtil.removeRole(reply.author.id, keyword);
            return message.reply("Unexpected error; Failed to add the reaction to your message. Your role has been deleted to prevent potential issues.");
        }
        
        const spaceId = reply.channelId;
        ReactionMessageUtil.createCollector(reply, spaceId);
        
        // finish by telling them how to ping
        const prefix = util.request("prefix");
        const messageLink = util.makeMessageLink(reply);
        const emojiMention = resolvedEmoji.type === "unicode" ? emoji : `the emoji`;
        message.reply({
            content: `Role **${keyword}** created (accessible by [reacting to the message](${messageLink}) with ${emojiMention}). You can manage this role with other commands.`
                + `\n` + `Use \`${prefix}reactionping ${keyword}\` to ping users which add themselves to the role.`
                + `\n` + `-# You may delete this message with other commands.`,
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