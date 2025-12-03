const { MessageAttachment, MessageEmbed } = require('discord.js');
const { createCanvas, loadImage, registerFont } = require('canvas');
const OptionType = require('../../util/optiontype');
const { Jimp: jimp, JimpMime } = require('jimp');

class Command {
    constructor() {
        this.name = "rip";
        this.description = "Make a tombstone of a user.";
        this.attributes = {
            unlisted: false,
            admin: false,
            lockedToCommands: true,
        };
    }

    async invoke(message, _, util) {
        const tombstoneTemplate = await loadImage('./assets/tombstone.png');
        const canvas = createCanvas(tombstoneTemplate.width, tombstoneTemplate.height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(tombstoneTemplate, 0, 0, canvas.width, canvas.height);

        const userMention = message.mentions.users.first();

        if (util.interactionsBlocked(userMention)) {
            if (userMention.id !== message.author.id) return message.reply('The user you mentioned has interactions disabled.');
        }

        // Carregue a imagem do usuário
        // i dont know what that comment says
        const avatarURL = userMention ?
            userMention.displayAvatarURL({ format: 'png', size: 128 })
            : message.author.displayAvatarURL({ format: 'png', size: 128 });
        // grayscale the image
        const jimpImage = await jimp.read(avatarURL ?? './assets/pink_default.jpg');
        jimpImage.color([{ apply: "greyscale" }]);
        jimpImage.circle();
        const buffer = await jimpImage.getBuffer(JimpMime.png);
        const avatar = await loadImage(buffer);

        // Desenhe a imagem do usuário no centro
        const centerX = (canvas.width - (84 + 20)) / 2;
        const centerY = (canvas.height - (84 - 69)) / 2;
        ctx.drawImage(avatar, centerX, centerY, 84, 84);

        ctx.font = '20px Sans';
        ctx.textAlign = "center";

        if (userMention) {
            ctx.fillText(userMention.username, canvas.width / 2, 245);
        } else {
            ctx.fillText(message.author.username, canvas.width / 2, 245);
        }

        // Salve o pôster como um anexo
        const attachment = new MessageAttachment(canvas.toBuffer(), 'tombstone.png');

        const title = userMention ? `${userMention.username}'s Tombstone` : "Your Tombstone";

        const embed = new MessageEmbed()
            .setTitle(title)
            .setImage('attachment://tombstone.png');


        const messageOptions = {
            embeds: [embed],
            files: [attachment]
        };

        message.reply(messageOptions);
    }
}

module.exports = Command;
