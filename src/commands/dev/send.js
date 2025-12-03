const childProcess = require("child_process");
const { MessageAttachment } = require('discord.js');

class Command {
    constructor() {
        this.name = "send";
        this.description = "send a nice message";
        this.attributes = {
            unlisted: true,
            permission: 2,
        };
    }

    async invoke(message, args, util) {
        const channelid = args.shift();
        const replyId = /^[0-9]+$/.test(args.at(-1)) ? args.pop() : '';

        if (!message.guild) return message.reply("no guild");

        const channel = message.guild.channels.cache.get(channelid);
        if (!channel) return message.reply("no channel");

        await channel.send({
            reply: {
                messageReference: replyId,
                failIfNotExist: false
            },
            content: args.join(" ") || undefined,
            files: message.attachments.toJSON().map(v => new MessageAttachment(v.url, v.name)),
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
