const petPetGif = require('pet-pet-gif');
const Discord = require("discord.js");
const OptionType = require('../../util/optiontype');

class Command {
    constructor() {
        this.name = "pet";
        this.description = "make a pet pet gif";
        this.attributes = {
            unlisted: false,
            admin: false,
            lockedToCommands: true,
        };
        this.alias = ["petpet", "petgif"];
    }

    async invoke(message, _, util) {
        const [imageBuffer] = await util.getInputImagesForCommand(message);
        if (!imageBuffer) return;

        const animatedGif = await petPetGif(imageBuffer);

        // Convert the canvas to a Discord attachment
        const attachment = new Discord.MessageAttachment(animatedGif, 'petpet.gif');
        
        // Send the image as a reply
        message.reply({ files: [attachment] });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;

//mubi was here :3