const discord = require("discord.js");
const os = require("os-utils");

const fetchCpuUsage = () => {
    return new Promise((resolve) => {
        const waitStarted = (new Date()).getTime();
        os.cpuUsage((usage) => {
            const responseTime = ((new Date()).getTime()) - waitStarted;
            resolve({
                cpuUsage: usage,
                waitTime: responseTime
            });
        });
    });
};

class Command {
    constructor(client) {
        this.name = "stats";
        this.description = "Get internal server details about the bot.";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };

        this.client = client;
    }

    async invoke(message) {
        message.channel.sendTyping();
        const { cpuUsage, waitTime:cpuFetchTime } = await fetchCpuUsage();
        
        const embed = new discord.MessageEmbed();
        embed.setColor("#00c3ff");
        embed.setTitle('Statistics');

        embed.addFields({
            name: 'Server Host Details',
            value: `\`\`${process.platform} ${process.arch} on Node ${process.version}\`\``,
            inline: false
        }, {
            name: 'CPU Fetch Time',
            value: `${cpuFetchTime}ms`,
            inline: true
        });

        const memUsage = Math.round((os.freemem() / os.totalmem()) * 100) + '%';
        const readableCpuUsage = Math.round(cpuUsage * 100) + '%';
        embed.setFooter({
            text: `Memory: ${memUsage} | CPU: ${readableCpuUsage}`
        });

        message.reply({
            embeds: [embed]
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;