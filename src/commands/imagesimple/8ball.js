const { MessageEmbed, MessageAttachment } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const OptionType = require('../../util/optiontype');

class Command {
    constructor() {
        this.name = "8ball";
        this.description = "Ask the magic 8-ball a question!";
        this.attributes = {
            unlisted: false,
            admin: false,
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

    async invoke(message, args) {
        // Create a canvas
        const canvas = createCanvas(500, 500);
        const ctx = canvas.getContext('2d');

        // Load the magic 8-ball image
        const ballImage = await loadImage('./assets/8ball.png');

        // Draw the 8-ball image on the canvas
        ctx.drawImage(ballImage, 0, 0, canvas.width, canvas.height);

        // Generate a random response
        const responses = ['It is certain', 'It is decidedly so', 'Without a doubt', 'Yes definitely', 'You may rely on it', 'As I see it, yes', 'Most likely', 'Outlook good', 'Yes', 'Signs point to yes', 'Reply hazy, try again', 'Ask again later', 'Better not tell you now', 'Cannot predict now', 'Concentrate and ask again', 'Dont count on it', 'My reply is no', 'My sources say no', 'Outlook not so good', 'Very doubtful'];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];

        // Draw the response on the canvas
        ctx.fillStyle = 'white';
        ctx.font = 'bold 25px Segoe UI';
        ctx.textAlign = 'center';
        
        ctx.fillText(randomResponse, 250, 250);

        const attachment = new MessageAttachment(canvas.toBuffer("image/png"), 'magic8ball.png');

        // Create a MessageEmbed
        const embed = new MessageEmbed()
            .setTitle('Magic 8-Ball')
            .setImage('attachment://magic8ball.png')
            .setColor('#0099ff')
            .setFooter({
                text: `${message.author.username} | ${args.join(' ')}`,
                iconURL: `${message.author.displayAvatarURL({ format: 'png', size: 2048 })}`,
              })

        // Send the embed
        const messageOptions = {
            embeds: [embed],
            files: [attachment]
        };

        message.reply(messageOptions);
    }
}

module.exports = Command;
