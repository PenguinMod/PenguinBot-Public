const { MessageAttachment, MessageEmbed } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas')
const OptionType = require('../../util/optiontype');

class Command {
    constructor() {
        this.name = "wanted";
        this.description = "Wanted Poster on someone or you";
        this.attributes = {
            unlisted: false,
            admin: false,
            lockedToCommands: true,
        };
    }

    async invoke(message, _, util) {
        const canvas = createCanvas(300, 400);
        const ctx = canvas.getContext('2d');

        const posterTemplate = await loadImage('./assets/wanted.png');
        ctx.drawImage(posterTemplate, 0, 0, canvas.width, canvas.height);

        const userMention = message.mentions.users.first();
        if (util.interactionsBlocked(userMention)) {
            if (userMention.id !== message.author.id) return message.reply('The user you mentioned has interactions disabled.');
        }

        const avatarURL = userMention ?
            userMention.displayAvatarURL({ format: 'png', size: 128 })
            : message.author.displayAvatarURL({ format: 'png', size: 128 });
        const avatar = await loadImage(avatarURL ?? './assets/pink_default.jpg');

        const centerX = (canvas.width - 128) / 2;
        const centerY = (canvas.height - 128) / 2;
        ctx.drawImage(avatar, centerX, centerY, 128, 128);

        ctx.fillStyle = '#462212';
        ctx.font = '30px PilotPointNFW01-Regular';
        ctx.textAlign = "center";

        if (userMention) {
            ctx.fillText(capitalize(userMention.username), canvas.width / 2, 300);
        } else {
            ctx.fillText(capitalize(message.author.username), canvas.width / 2, 300);
        }

        const attachment = new MessageAttachment(canvas.toBuffer("image/png"), 'wanted-poster.png');

        const messageOptions = {
            files: [attachment]
        };

        message.reply(messageOptions);
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = Command;