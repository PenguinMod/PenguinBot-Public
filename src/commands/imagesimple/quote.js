const { MessageAttachment, Message } = require('discord.js');
const Canvas = require('canvas');

const OptionType = require('../../util/optiontype');
const env = require("../../util/env-util");

class Command {
    constructor() {
        this.name = "quote";
        this.description = "Quotes the provided text and puts it on an image.";
        this.attributes = {
            unlisted: false,
            admin: false,
        };
    }

    /**
     * @param {Message} message
     * @param {string[]} args
     */
    async invoke(message, args, util) {
        let quoteText;
        let user;
        let referencedMessage = message
        let options = {
            bold: false,
            italic: false
        }

        if (message.reference) {
            referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
            let overrideText = (env.get("OWNER") == message.author.id && args.length > 2)
            quoteText = overrideText ? args.join(' ').trim() : referencedMessage.content;
            user = referencedMessage.author;

            if (message.author.id !== env.get("OWNER") && message.author.id !== user.id && util.interactionsBlocked(user.id)) {
                return message.reply('The user you mentioned has interactions disabled.');
            }

            if (!overrideText) {
                if (args.includes("bold" || args.includes("b"))) options.bold = true
                if (args.includes("italic") || args.includes("italics") || args.includes("i")) options.italic = true
            }
        } else {
            quoteText = args.join(' ').trim();
            user = message.author;
        }

        let emojis = []

        quoteText = quoteText.replaceAll('\n', ' ')

        if (!quoteText) {
            return message.reply('Please provide a text to quote.');
        }

        quoteText = quoteText.replace(/<:[\w-]+:(\d+)>/g, (match, p1) => {emojis.push(p1); return ''})
        quoteText = quoteText.replace(/ +(?= )/g,'')
        if (quoteText.length > 256) {
            quoteText = quoteText.substring(0, 256)
            quoteText += "..."
        }

        const canvas = Canvas.createCanvas(1920, 1080);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const guildMember = message.guild.members.cache.get(user.id);
        const avatarURL = guildMember && guildMember.avatar 
            ? guildMember.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) 
            : user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });
        
        const avatar = await Canvas.loadImage(avatarURL);

        ctx.drawImage(avatar, 0, 0, 1080, 1080);

        function squareRatio(size, w, h) {
            if (w < h) return [size * h / w, size]
            if (w > h) return [size * w / h, size]
            return [size, size]
        }

        //emojis
        let emojiCache = {}
        for (var emoji of emojis) {
            let img = emojiCache[emoji] ?? await Canvas.loadImage(`https://cdn.discordapp.com/emojis/${emoji}.png`)
            let x = 80 + Math.random() * 800
            let y = 80 + Math.random() * 920
            let w = squareRatio(96, img.width, img.height)[0]
            let h = squareRatio(96, img.width, img.height)[1]
            ctx.translate(x + w/2, y + h/2)
            ctx.rotate((Math.random() * 40 - 20) * Math.PI / 180)
            ctx.translate(-(x + w/2), -(y + h/2))
            ctx.drawImage(img, x, y, w, h)
            ctx.setTransform(1, 0, 0, 1, 0, 0)

            emojiCache[emoji] = img
        }

        // gradient
        const gradient = ctx.createLinearGradient(0, 0, 1920, 0);
        gradient.addColorStop(0.0, "#0002");
        gradient.addColorStop(0.5, "#000");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1920, 1080);

        // text
        
        let fontSize = Math.round(80 - quoteText.length * 0.12)

        ctx.font = `${fontSize}px sans-serif`;
        if (options.bold) ctx.font = 'bold ' + ctx.font
        if (options.italic) ctx.font = 'italic ' + ctx.font
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        function getLines(ctx, text, maxWidth) {
            let words = text.split(" ");
            let lines = [];
            let currentLine = words[0];

            for (var i = 1; i < words.length; i++) {
                let word = words[i];
                let width = ctx.measureText(currentLine + " " + word).width;
                if (width < maxWidth) {
                    currentLine += " " + word;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            }
            lines.push(currentLine);
            return lines;
        }

        let lines = getLines(ctx, quoteText, 800);
        let lineHeight = fontSize * 1.2;
        let y = 1080 / 2 - lineHeight * (lines.length - 1) * 0.5;
        let x = 1920 / 4 * 3;
        for (var line of lines) {
            ctx.fillText(line, x, y);
            y += lineHeight;
        }

        //username
        ctx.font = `40px sans-serif`;
        ctx.fillStyle = '#fff8';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        let authorText = `@${referencedMessage.author.username}`
        if (referencedMessage.author.nickname !== undefined) authorText = `(${referencedMessage.author.nickname}) ` + authorText
        ctx.fillText(authorText, 1920 - 20, 1080 - 20)

        const attachment = new MessageAttachment(canvas.toBuffer(), 'quote.png');

        message.reply({ files: [attachment] });
    }
}

module.exports = Command;
