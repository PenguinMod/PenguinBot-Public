const { MessageAttachment, Message } = require('discord.js');
const Canvas = require('@napi-rs/canvas')
const OptionType = require('../../util/optiontype');

const rarities = [
    {
        name: "Trash",
        color: "#9ec77f",
        rng: 1.01
    },
    {
        name: "Common",
        color: "#eeeeee",
        rng: 2
    },
    {
        name: "Rare",
        color: "#fff2ab",
        rng: 5
    },
    {
        name: "Lucky",
        color: "#6ae670",
        rng: 20
    },
    {
        name: "Exotic",
        color: "#b078ff",
        rng: 100
    },
    {
        name: "Divine",
        color: "#ff458c",
        rng: 500
    },
    {
        name: "Destiny",
        color: "#f5cc14",
        border: "#9e8100",
        rng: 2000
    },
    {
        name: "Exotic",
        color: "#6431d4",
        border: "#3f9e13",
        rng: 7500
    }
]

const secrets = [
    {
        name: "Cursed",
        color: "#d91900",
        border: "#590016",
        bg: "#190424",
        rng: 1000,
        display: 1
    },
]

const qualities = [
    {
        name: "Golden",
        color: "#ffaa00",
        rng: 50
    },
    {
        name: "Blessed",
        color: "#69ffaa",
        rng: 250
    }
]

class Command {
    constructor() {
        this.name = "rng";
        this.description = "NOT roblox gambling, defenitely not";
        this.attributes = {
            unlisted: true,
            permission: 0,
            lockedToCommands: true,
        };
    }

    /**
     * @param {Message} message
     * @param {string[]} args
     */
    async invoke(message, args, util) {
        let rng = Math.ceil(1/Math.random()*100)/100
        let rarity = rarities.filter(x => x.rng <= rng)[rarities.filter(x => x.rng <= rng).length-1]

        let secretRng = 1/Math.random()
        let secret = secrets.filter(x => x.rng <= secretRng)[secrets.filter(x => x.rng <= secretRng).length-1]

        if (secret) {
            rng = secret.display
            rarity = secret
        }

        let qualityRng = 1/Math.random()
        let quality = qualities.filter(x => x.rng <= qualityRng)[qualities.filter(x => x.rng <= qualityRng).length-1]

        if (quality) {
            rng *= quality.rng
        }

        const canvas = Canvas.createCanvas(720, 240)
        const ctx = canvas.getContext('2d')

        ctx.fillStyle = rarity.bg || "#000"
        ctx.fillRect(0, 0, 720, 240)

        ctx.font = "bold italic 24px sans-serif"
        ctx.fillStyle = "#fff"
        ctx.textAlign = 'center'
        ctx.fillText(rng.toFixed(2), 360, 228)

        ctx.font = "bold 64px sans-serif"
        ctx.fillStyle = rarity.color
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        if (rarity.border) {
            ctx.strokeStyle = rarity.border
            ctx.lineWidth = 8
            ctx.strokeText(rarity.name, 360, 120)
        }
        ctx.fillText(rarity.name, 360, 120)

        if (quality) {
            ctx.font = "bold italic 32px sans-serif"
            ctx.fillStyle = quality.color
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(quality.name, 360, 80)
        }

        //username
        ctx.font = `16px sans-serif`;
        ctx.fillStyle = '#fff8';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        let authorText = `@${message.author.username}`
        ctx.fillText(authorText, 708, 228)

        const attachment = new MessageAttachment(canvas.toBuffer("image/png"), 'quote.png')

        message.reply({ files: [attachment] })
    }
}

module.exports = Command;
