const discord = require('discord.js');

const BaseCommand = require("../../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "send";
        this.description = "send a nice message";
        this.attributes = {
            unlisted: true,
            permission: 2,
        };
    }

    async invoke(message, args, util) {
        if (!message.guild)
            return message.reply("no guild");

        const channelId = args.shift();
        const channel = message.guild.channels.cache.get(channelId);
        if (!channel) return message.reply("no channel");

        const replyId = /^[0-9]+$/.test(args.at(-1)) ? args.pop() : '';
        await channel.send({
            reply: {
                messageReference: replyId,
                failIfNotExist: false
            },
            content: args.join(" ") || undefined,
            files: message.attachments.toJSON().map(file => new discord.MessageAttachment(file.url, file.name)),
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
