const discord = require("discord.js");

const BaseCommand = require("../../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
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
    }

    async invoke(message) {
        const embed = new discord.MessageEmbed();
        embed.setColor("#00c3ff");
        embed.setTitle('Credits');
        
        embed.setDescription('Thanks to all the contributors & help on the creation of PenguinBot!');
        embed.addFields({
            name: 'Contributors',
            value: `JeremyGamer13, MubiLop, godslayerakp, jwklong, ianyourgod, enhancedrock,`
                + " " + `anonygoose, FreshPenguin112, enderhacker, PuzzlingGGG, 10000000_fireflies`,
            inline: false
        }, {
            name: 'PenguinMod',
            value: `PenguinBot is developed and maintained by the developers of [PenguinMod](https://penguinmod.com/).`,
            inline: false
        });

        message.reply({
            embeds: [embed]
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;