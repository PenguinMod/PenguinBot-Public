const discord = require('discord.js');

const Canvas = require('skia-canvas');

const OptionType = require('../../util/optiontype.js');
const DiscordUtility = require("../../util/utility-discord.js");
const SkiaCanvasUtil = require("../../util/canvas-util-skia.js");

const BaseCommand = require("../../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "wanted";
        this.description = "Wanted Poster on someone or you";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };
    }

    async invoke(message, _, util) {
        const canvas = new Canvas.Canvas(300, 400);
        const ctx = canvas.getContext('2d');

        const posterTemplate = await Canvas.loadImage('./assets/wanted.png');
        ctx.drawImage(posterTemplate, 0, 0, canvas.width, canvas.height);

        const userMention = message.mentions.users.first();
        if (!util.canInteract(userMention))
            return message.reply('The user you mentioned has interactions disabled.');

        const avatarURL = userMention ?
            DiscordUtility.avatarURL(userMention, { format: 'png', size: 128 })
            : DiscordUtility.avatarURL(message.author, { format: 'png', size: 128 });
        const avatar = await Canvas.loadImage(avatarURL ?? './assets/pink_default.jpg');

        const centerX = (canvas.width - 128) / 2;
        const centerY = (canvas.height - 128) / 2;
        ctx.drawImage(avatar, centerX, centerY, 128, 128);

        ctx.fillStyle = '#462212';
        ctx.font = '30px PilotPointNFW01-Regular';
        ctx.textAlign = "center";

        if (userMention) {
            SkiaCanvasUtil.fillText(ctx, capitalize(userMention.username), canvas.width / 2, 300);
        } else {
            SkiaCanvasUtil.fillText(ctx, capitalize(message.author.username), canvas.width / 2, 300);
        }

        const attachment = new discord.MessageAttachment(await canvas.toBuffer("image/png"), 'wanted-poster.png');

        const title = userMention ? `${userMention.username}'s Wanted Poster` : "Your Wanted Poster";

        const embed = new discord.MessageEmbed()
            .setTitle(title)
            .setImage('attachment://wanted-poster.png');


        const messageOptions = {
            embeds: [embed],
            files: [attachment]
        };

        message.reply(messageOptions);
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = Command;