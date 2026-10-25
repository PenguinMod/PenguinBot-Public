const discord = require('discord.js');

const Canvas = require('skia-canvas');
const { Jimp: jimp, JimpMime } = require('jimp');

const OptionType = require('../../util/optiontype.js');
const DiscordUtility = require("../../util/utility-discord.js");
const SkiaCanvasUtil = require("../../util/canvas-util-skia.js");

const BaseCommand = require("../../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "rip";
        this.description = "Make a tombstone of a user.";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };
    }

    async invoke(message, _, util) {
        const tombstoneTemplate = await Canvas.loadImage('./assets/tombstone.png');
        const canvas = new Canvas.Canvas(tombstoneTemplate.width, tombstoneTemplate.height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(tombstoneTemplate, 0, 0, canvas.width, canvas.height);

        const userMention = message.mentions.users.first();

        if (!util.canInteract(userMention))
            return message.reply('The user you mentioned has interactions disabled.');

        // Carregue a imagem do usuário i dont know what that comment says
        const avatarURL = userMention ?
            DiscordUtility.avatarURL(userMention, { format: 'png', size: 128 })
            : DiscordUtility.avatarURL(message.author, { format: 'png', size: 128 });
        // grayscale the image
        const jimpImage = await jimp.read(avatarURL ?? './assets/pink_default.jpg');
        jimpImage.color([{ apply: "greyscale" }]);
        jimpImage.circle();
        const buffer = await jimpImage.getBuffer(JimpMime.png);
        const avatar = await Canvas.loadImage(buffer);

        // Desenhe a imagem do usuário no centro
        const centerX = (canvas.width - (84 + 20)) / 2;
        const centerY = (canvas.height - (84 - 69)) / 2;
        ctx.drawImage(avatar, centerX, centerY, 84, 84);

        ctx.font = '20px Sans';
        ctx.textAlign = "center";

        if (userMention) {
            SkiaCanvasUtil.fillText(ctx, userMention.username, canvas.width / 2, 245);
        } else {
            SkiaCanvasUtil.fillText(ctx, message.author.username, canvas.width / 2, 245);
        }

        // Salve o pôster como um anexo
        const attachment = new discord.MessageAttachment(await canvas.toBuffer("image/png"), 'tombstone.png');

        const title = userMention ? `${userMention.username}'s Tombstone` : "Your Tombstone";

        const embed = new discord.MessageEmbed()
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
