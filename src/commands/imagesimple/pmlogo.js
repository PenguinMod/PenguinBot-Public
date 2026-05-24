const { createCanvas, loadImage } = require('canvas');
const OptionType = require('../../util/optiontype');
const Discord = require('discord.js');

class Command {
    constructor() {
        this.name = "pmlogo";
        this.description = "Generate a photo with the Penguin Mod logo on top of the mentioned user's avatar or a custom background color.";
        this.attributes = {
            unlisted: false,
            admin: false,
            lockedToCommands: true,
        };
    }

    async invoke(message, _, util) {
        const [imageBuffer] = await util.getInputImagesForCommand(message);
        if (!imageBuffer) return;

        // Load second image
        const secondImage = await loadImage('./assets/pm_transparent_dropshadow.png');

        // Create a 512x512 canvas
        const canvas = createCanvas(512, 512);
        const ctx = canvas.getContext('2d');

        // Set the background color or draw user's avatar as the background
        const userAvatar = await loadImage(imageBuffer);
        ctx.drawImage(userAvatar, 0, 0, 512, 512);

        // Draw the second image on top
        ctx.drawImage(secondImage, 0, 0, 512, 512);

        // Convert the canvas to a Discord attachment
        const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'you_pm.png');

        // Send the image as a reply
        message.reply({ files: [attachment] });
    }
}

module.exports = Command;
//mubi was here :3