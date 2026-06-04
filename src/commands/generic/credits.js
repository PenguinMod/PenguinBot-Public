const discord = require("discord.js");

class Command {
    constructor(client) {
        this.name = "credits";
        this.description = "View creation credits for the bot.";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };
        this.slash = {
            options: []
        };

        this.client = client;
    }

    async invoke(message) {
        const embed = new discord.MessageEmbed();
        embed.setColor("#00c3ff");
        embed.setTitle('Credits');
        
        embed.setDescription('Thanks to all the contributors & help on the creation of PenguinBot!');
        embed.addFields({
            name: 'Created by',
            value: `JeremyGamer13`,
            inline: false
        }, {
            name: 'With extra commands & framework additions by',
            value: `MubiLop\\*`,
            inline: false
        }, {
            name: 'Extra Help on commands or systems',
            value: `godslayerakp, jwklong, ianyourgod, enhancedrock`,
            inline: false
        });

        embed.setFooter({
            text: `* = No longer a developer`
        });

        message.reply({
            embeds: [embed]
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;