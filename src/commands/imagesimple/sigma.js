const discord = require("discord.js");

const Canvas = require('skia-canvas');

const BaseCommand = require("../../classes/basecommand.js");

class SigmaCommand extends BaseCommand {
    constructor() {
        super();
        this.name = "sigma";
        this.description = "I feel so sigma!";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };
    }

    async invoke(message, args, util) {
        const [imageBuffer] = await util.getInputImagesForCommand();
        if (!imageBuffer) return;

        const userImage = await Canvas.loadImage(imageBuffer);
        const sigmaTemplate = await Canvas.loadImage('assets/feelsosigma.png');

        // Create a canvas
        const canvas = new Canvas.Canvas(sigmaTemplate.width, sigmaTemplate.height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(sigmaTemplate, 0, 0, canvas.width, canvas.height);
        ctx.drawImage(userImage, 29, 169, 287, 287);
        
        // Convert the canvas to a Discord attachment
        const attachment = new discord.MessageAttachment(await canvas.toBuffer("image/png"), 'sigma.png');

        // Send the license image as a reply
        message.reply({ files: [attachment] });
    }
}

module.exports = SigmaCommand;
