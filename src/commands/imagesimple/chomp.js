const discord = require("discord.js");

const Canvas = require('skia-canvas');

const OptionType = require('../../util/optiontype.js');
const BaseCommand = require("../../classes/basecommand.js");

const chompImages = {};
const loadImages = async () => {
    chompImages.top = await Canvas.loadImage('assets/chomp_top.png');
    chompImages.mid = await Canvas.loadImage('assets/chomp_mid.png');
    chompImages.bottom = await Canvas.loadImage('assets/chomp_bottom.png');
};
loadImages();

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "chomp";
        this.description = "block eats you";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };
    }

    async invoke(message, _, util) {
        const [imageBuffer] = await util.getInputImagesForCommand();
        if (!imageBuffer) return;

        // add some whitespace around the image
        const padding = 2;
        const avatarImage = await Canvas.loadImage(imageBuffer);
        const paddingCanvas = new Canvas.Canvas(avatarImage.width + (padding * 2), avatarImage.height + (padding * 2));
        const paddingCtx = paddingCanvas.getContext("2d");
        paddingCtx.drawImage(avatarImage, padding, padding);
        const paddingBuffer = await paddingCanvas.toBuffer("image/png");
        const paddingImage = await Canvas.loadImage(paddingBuffer);

        // add chomp images
        const imagePlacementX = 32; // where the padding image will start on the X position
        const finalWidth = Math.max(chompImages.top.width, imagePlacementX + paddingCanvas.width);
        const finalHeight = paddingCanvas.height + chompImages.top.height + chompImages.bottom.height;
        const canvas = new Canvas.Canvas(finalWidth, finalHeight);
        const ctx = canvas.getContext("2d");
        // draw the actual provided image
        ctx.drawImage(paddingImage, imagePlacementX, chompImages.top.height);
        // draw above because of the shadows
        ctx.drawImage(chompImages.top, 0, 0);
        ctx.drawImage(chompImages.bottom, 0, finalHeight - chompImages.bottom.height);
        ctx.drawImage(chompImages.mid, 0, chompImages.top.height, chompImages.mid.width, finalHeight - (chompImages.top.height + chompImages.bottom.height));
        const buffer = await canvas.toBuffer("image/png");

        // Convert the canvas to a Discord attachment
        const attachment = new discord.MessageAttachment(buffer, 'chomp.png');
        
        // Send the image as a reply
        message.reply({ files: [attachment] });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;