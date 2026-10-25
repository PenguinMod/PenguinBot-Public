const discord = require("discord.js");

const { Jimp, JimpMime, BlendMode } = require("jimp");

const BaseCommand = require("../../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "glow";
        this.description = "Makes the attached image glowy";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };

        this.alias = ["glowy"];
    }

    async invoke(message, _, util) {
        const [imageBuffer] = await util.getInputImagesForCommand();
        if (!imageBuffer) return;

        // glow adapted from one of jg13 old bots
        const jimpImage = await Jimp.read(imageBuffer);
        const jimpImageOverlay = await Jimp.read(imageBuffer);

        // very cheap glow effect by just adding the same image with blur
        jimpImageOverlay.blur(16);
        jimpImage.composite(jimpImageOverlay, 0, 0, {
            mode: BlendMode.ADD
        });

        // Convert the canvas to a Discord attachment
        const buffer = await jimpImage.getBuffer(JimpMime.png);
        const attachment = new discord.MessageAttachment(buffer, 'glow.png');
        message.reply({ files: [attachment] });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;