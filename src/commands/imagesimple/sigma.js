const Discord = require("discord.js");

const { createCanvas, loadImage } = require('@napi-rs/canvas')

class SigmaCommand {
    constructor() {
        this.name = "sigma";
        this.description = "I feel so sigma!";
        this.attributes = {
            unlisted: false,
            admin: false,
            lockedToCommands: true,
        };
    }

    async invoke(message, args, util) {
        const [imageBuffer] = await util.getInputImagesForCommand(message);
        if (!imageBuffer) return;

        const userImage = await loadImage(imageBuffer);
        const sigmaTemplate = await loadImage('assets/feelsosigma.png');

        // Create a canvas
        const canvas = createCanvas(sigmaTemplate.width, sigmaTemplate.height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(sigmaTemplate, 0, 0, canvas.width, canvas.height);
        ctx.drawImage(userImage, 29, 169, 287, 287);
        
        // Convert the canvas to a Discord attachment
        const attachment = new Discord.MessageAttachment(canvas.toBuffer("image/png"), 'sigma.png');

        // Send the license image as a reply
        message.reply({ files: [attachment] });
    }
}

module.exports = SigmaCommand;
