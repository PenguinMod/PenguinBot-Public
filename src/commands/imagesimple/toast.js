const Discord = require('discord.js');
const OptionType = require('../../util/optiontype');
const { Jimp: jimp, JimpMime, BlendMode } = require('jimp');

class Command {
    constructor() {
        this.name = "toast";
        this.description = "Toastify yourself";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };
    }

    async invoke(message) {
        const background = await jimp.read('./assets/toast.png');
        const userAvatar = await jimp.read(message.author.displayAvatarURL({ format: 'png' }));

        userAvatar.resize({ w: 320, h: 320 }).circle();

        userAvatar.color([{ apply: "greyscale" }]);

        background.composite(userAvatar, (background.width / 2) - 160, (background.height / 2) - 160, {
            mode: BlendMode.MULTIPLY
        });

        const buffer = await background.getBuffer(JimpMime.png);

        const attachment = new Discord.MessageAttachment(buffer, 'toast.png');

        message.reply({
            files: [attachment]
        });
    }
}

module.exports = Command;
