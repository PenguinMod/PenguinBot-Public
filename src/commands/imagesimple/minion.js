const Discord = require("discord.js");

const { createCanvas, loadImage } = require('@napi-rs/canvas')

const templateText = [
    [7, 16, 260],
    [221, 16, 193],
    [0, 5, 407],
    [3, 270, 458],
    [0, 7, 248],
    [0, 5, 231],
    [0, 1, 305],
    [229, 5, 490],
    [0, 4, 316],
    [0, 2, 224],
];

class Command {
    constructor() {
        this.name = "minion";
        this.description = "Uses a random minion meme with your own text.";
        this.attributes = {
            unlisted: false,
            admin: false,
            lockedToCommands: true,
        };
    }

    async invoke(message, args, util) {
        const templateIdx = Math.round(Math.random() * (templateText.length - 1));
        const textPosition = templateText[templateIdx];

        const minionTemplate = await loadImage(`assets/minions/template${`${templateIdx + 1}`.padStart(2, "0")}.png`);

        const canvas = createCanvas(minionTemplate.width, minionTemplate.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(minionTemplate, 0, 0, canvas.width, canvas.height);

        const minionText = args.join(" ").trim();
        ctx.font = 'italic 40px Times New Roman';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'left';
        ctx.fillText(minionText, textPosition[0], textPosition[1] + 28, textPosition[2]);
        
        const attachment = new Discord.MessageAttachment(canvas.toBuffer("image/png"), 'minion.png');
        message.reply({ files: [attachment] });
    }
}

module.exports = Command;
