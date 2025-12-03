const Discord = require('discord.js');
const OptionType = require('../../util/optiontype');
const { Jimp: jimp, JimpMime, BlendMode } = require('jimp');

class Command {
    constructor() {
        this.name = "toast";
        this.description = "Toastify yourself";
        this.attributes = {
            unlisted: false,
            admin: false,
            lockedToCommands: true,
        };
    }

    async invoke(message) {
        // Load background image
        const background = await jimp.read('./assets/toast.png');

        // Load user's avatar
        const userAvatar = await jimp.read(message.author.displayAvatarURL({ format: 'png' }));

        // Resize and roundify user's avatar
        userAvatar.resize({ w: 320, h: 320 }).circle();

        // Apply grayscale filter to user's avatar
        userAvatar.color([{ apply: "greyscale" }]);

        // Composite user's avatar onto the background
        background.composite(userAvatar, (background.width / 2) - 160, (background.height / 2) - 160, {
            mode: BlendMode.MULTIPLY
        });

        // Convert Jimp image to buffer for Discord.js
        const buffer = await background.getBuffer(JimpMime.png);

        // Create a Discord.js attachment from the buffer
        const attachment = new Discord.MessageAttachment(buffer, 'toast.png');

        // Create an embed with an image attachment
        const embed = new Discord.MessageEmbed()
            .setTitle('Toast')
            .setImage('attachment://toast.png');

        // Send the embed with the image
        const messageOptions = {
            embeds: [embed],
            files: [attachment]
        };

        message.reply(messageOptions);
    }
}

module.exports = Command;
