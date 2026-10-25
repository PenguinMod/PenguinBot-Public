const discord = require("discord.js");

const sharp = require("sharp");

const BaseCommand = require("../../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "opaque";
        this.description = "Makes the attached image opaque";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };
    }

    async invoke(message, _, util) {
        const [imageBuffer] = await util.getInputImagesForCommand();
        if (!imageBuffer) return;

        // opaque
        const buffer = await sharp(imageBuffer)
            .removeAlpha()
            .png()
            .toBuffer();

        // Convert the canvas to a Discord attachment
        const attachment = new discord.MessageAttachment(buffer, 'opaque.png');
        message.reply({ files: [attachment] });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;