const discord = require("discord.js");

const sharp = require("sharp");

const BaseCommand = require("../../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "gray";
        this.description = "Makes the attached image grayscale";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };

        this.alias = ["grey", "grayscale", "greyscale"];
    }

    async invoke(message, _, util) {
        const [imageBuffer] = await util.getInputImagesForCommand();
        if (!imageBuffer) return;

        // gray
        const buffer = await sharp(imageBuffer)
            .grayscale()
            .png()
            .toBuffer();

        // Convert the canvas to a Discord attachment
        const attachment = new discord.MessageAttachment(buffer, 'gray.png');
        message.reply({ files: [attachment] });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;