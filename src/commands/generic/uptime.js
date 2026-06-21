const discord = require("discord.js");

const systemInformation = require("systeminformation");
const FormatTime = require('../../util/format-time');

class Command {
    constructor(client) {
        this.name = "uptime";
        this.description = "How long the bot has been online for.";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };

        this.client = client;
    }

    async invoke(message) {
        const embed = new discord.MessageEmbed();
        embed.setColor("#00c3ff");
        embed.setTitle('Uptime');

        const timeInfo = systemInformation.time();
        const botUptime = FormatTime.formatTime(this.client.uptime);
        const systemUptime = FormatTime.formatTime(timeInfo.uptime * 1000);

        embed.addFields({
            name: 'Bot Run-length',
            value: `${botUptime}`,
            inline: false
        }, {
            name: 'Server Run-length',
            value: `${systemUptime}`,
            inline: false
        });

        message.reply({
            embeds: [embed]
        });
    }
}

module.exports = Command;
