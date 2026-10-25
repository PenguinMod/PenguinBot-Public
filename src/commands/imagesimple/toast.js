const discord = require('discord.js');

const { Jimp: jimp, JimpMime, BlendMode } = require('jimp');

const OptionType = require('../../util/optiontype.js');
const DiscordUtility = require("../../util/utility-discord.js");

const BaseCommand = require("../../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "toast";
        this.description = "Toastify yourself";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };
    }

    async invoke(message, _, util) {
        // Load background image
        const background = await jimp.read('./assets/toast.png');

        // Load user's avatar
        const userAvatar = await jimp.read(util.avatarURL({ format: 'png' }));

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
        const attachment = new discord.MessageAttachment(buffer, 'toast.png');

        // Create an embed with an image attachment
        const embed = new discord.MessageEmbed()
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
