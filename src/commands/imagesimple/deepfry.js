const discord = require("discord.js");

const { Jimp, JimpMime, BlendMode } = require("jimp");

const BaseCommand = require("../../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "deepfry";
        this.description = "Deepfries the attached image 2020 style";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };
        
        this.alias = ["deepfried", "fry", "fried"];
    }

    async invoke(message, _, util) {
        const [imageBuffer] = await util.getInputImagesForCommand();
        if (!imageBuffer) return;

        // deepfry adapted from one of jg13 old bots
        const jimpImage = await Jimp.read(imageBuffer);
        jimpImage.contrast(1);
        for (let i = 0; i < 4; i++) {
            // sharpen
            jimpImage.convolute([
                [0, -1, 0],
                [-1, 5, -1],
                [0, -1, 0]
            ]);
        }

        // Convert the canvas to a Discord attachment
        const buffer = await jimpImage.getBuffer(JimpMime.jpeg, { quality: 1 });
        const attachment = new discord.MessageAttachment(buffer, 'deepfry.jpeg');
        message.reply({ files: [attachment] });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;