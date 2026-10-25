const discord = require('discord.js');

const Canvas = require('skia-canvas');

const OptionType = require('../../util/optiontype.js');
const SkiaCanvasUtil = require('../../util/canvas-util-skia.js');

const BaseCommand = require("../../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "8ball";
        this.description = "Ask the magic 8-ball a question!";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };
        this.slash = {
            options: [{
                type: OptionType.STRING,
                name: 'text',
                required: true,
                description: 'Your question to the magic 8-ball.'
            }]
        };
    }

    convertSlashCommand(interaction) {
        const text = `${interaction.options.getString('text')}`;
        interaction.author = interaction.member.user;
        return [interaction, text.split(' ')];
    }

    /**
     * @param {import("discord.js").Message} message 
     * @param {string[]} args 
     * @param {import("../../util/utility-command.js")} util 
     */
    async invoke(message, args, util) {
        // Create a canvas
        const canvas = new Canvas.Canvas(500, 500);
        const ctx = canvas.getContext('2d');

        // Load the magic 8-ball image
        const ballImage = await Canvas.loadImage('./assets/8ball.png');

        // Draw the 8-ball image on the canvas
        ctx.drawImage(ballImage, 0, 0, canvas.width, canvas.height);

        // Generate a random response
        const responses = [
            'It is certain',
            'It is decidedly so',
            'Without a doubt',
            'Yes definitely',
            'You may rely on it',
            'As I see it, yes',
            'Most likely',
            'Outlook good',
            'Yes',
            'Signs point to yes',
            'Reply hazy, try again',
            'Ask again later',
            'Better not tell you now',
            'Cannot predict now',
            'Concentrate and ask again',
            'Dont count on it',
            'My reply is no',
            'My sources say no',
            'Outlook not so good',
            'Very doubtful'
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];

        // Draw the response on the canvas
        ctx.fillStyle = 'white';
        ctx.font = 'bold 25px Segoe UI';
        ctx.textAlign = 'center';
        
        SkiaCanvasUtil.fillTextWrapped(ctx, randomResponse, 250, 250, 200, 25);

        const attachment = new discord.MessageAttachment(await canvas.toBuffer("image/png"), 'magic8ball.png');

        // Create a MessageEmbed
        const embed = new discord.MessageEmbed()
            .setTitle('Magic 8-Ball')
            .setImage('attachment://magic8ball.png')
            .setColor('#0099ff')
            .setFooter({
                text: `Requested by ${message.author.username}`,
                iconURL: `${util.avatarURL({ format: 'png', size: 64 })}`,
            });

        // Send the embed
        const messageOptions = {
            embeds: [embed],
            files: [attachment]
        };

        message.reply(messageOptions);
    }
}

module.exports = Command;
