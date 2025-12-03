const { createCanvas, loadImage } = require('canvas');
const Discord = require("discord.js");
const OptionType = require('../../util/optiontype');

const chompImages = {};
const loadImages = async () => {
    chompImages.top = await loadImage('assets/chomp_top.png');
    chompImages.mid = await loadImage('assets/chomp_mid.png');
    chompImages.bottom = await loadImage('assets/chomp_bottom.png');
};
loadImages();

class Command {
    constructor() {
        this.name = "chomp";
        this.description = "block eats you";
        this.attributes = {
            unlisted: false,
            admin: false,
            lockedToCommands: true,
        };
    }

    async invoke(message, _, util) {
        let userAvatarURL = message.author.displayAvatarURL({ format: 'png', size: 256 });

        // Check if a user is mentioned in the args
        const mention = message.mentions.users.first();
        if (util.interactionsBlocked(mention)) {
            if (mention.id !== message.author.id) return message.reply('The user you mentioned has interactions disabled.');
        }
        if (mention) {
            userAvatarURL = mention.displayAvatarURL({ format: 'png', size: 256 });
        }
        // check for attachment
        if ((message.attachments && message.attachments.size > 0)) {
            const attachment = message.attachments.at(0);
            try {
                const endingType = attachment.contentType.split(';')[0].split('/')[1];
                if (endingType !== 'png') {
                    throw new Error('invalid type');
                }
            } catch {
                return message.reply('Please use a valid image in `.png` format.');
            }
            const imageUrl = attachment.url;
            userAvatarURL = imageUrl;
        }

        // add some whitespace around the image
        const padding = 2;
        const avatarImage = await loadImage(userAvatarURL);
        const paddingCanvas = createCanvas(avatarImage.width + (padding * 2), avatarImage.height + (padding * 2));
        const paddingCtx = paddingCanvas.getContext("2d");
        paddingCtx.drawImage(avatarImage, padding, padding);
        const paddingBuffer = paddingCanvas.toBuffer();
        const paddingImage = await loadImage(paddingBuffer);

        // add chomp images
        const imagePlacementX = 32; // where the padding image will start on the X position
        const finalWidth = Math.max(chompImages.top.width, imagePlacementX + paddingCanvas.width);
        const finalHeight = paddingCanvas.height + chompImages.top.height + chompImages.bottom.height;
        const canvas = createCanvas(finalWidth, finalHeight);
        const ctx = canvas.getContext("2d");
        // draw the actual provided image
        ctx.drawImage(paddingImage, imagePlacementX, chompImages.top.height);
        // draw above because of the shadows
        ctx.drawImage(chompImages.top, 0, 0);
        ctx.drawImage(chompImages.bottom, 0, finalHeight - chompImages.bottom.height);
        ctx.drawImage(chompImages.mid, 0, chompImages.top.height, chompImages.mid.width, finalHeight - (chompImages.top.height + chompImages.bottom.height));
        const buffer = canvas.toBuffer();

        // Convert the canvas to a Discord attachment
        const attachment = new Discord.MessageAttachment(buffer, 'chomp.png');
        
        // Send the image as a reply
        message.reply({ files: [attachment] });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;