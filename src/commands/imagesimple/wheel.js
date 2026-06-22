const { createCanvas, loadImage } = require('@napi-rs/canvas')
const OptionType = require('../../util/optiontype');
const discord = require("discord.js");

class WheelCommand {
    constructor() {
        this.name = "wheel";
        this.description = "Spin the wheel and see which option it lands on! Use commas to seperate options.";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };
        this.slash = {
            options: [{
                type: OptionType.STRING,
                name: 'options',
                required: true,
                description: 'A list of options, seperated by commas.'
            }]
        };
    }

    convertSlashCommand(interaction) {
        const options = interaction.options.getString('options');
        const split = options.split(' '); // invoke splits by commas
        interaction.author = interaction.member.user;
        return [interaction, split, true];
    }

    async invoke(message, args, isSlash) {
        isSlash = isSlash === true;
        const options = args.join(" ").split(",");

        if (options.length < 2) {
            message.reply("Please provide at least two options to spin the wheel.\nUse commas to seperate the options.");
            return;
        }

        const randomIndex = Math.floor(Math.random() * options.length);
        const chosenOption = options[randomIndex].trim();

        let wheelMessage = await message.reply({
            content: `*Spinning the wheel...*`,
            files: ['./assets/wheel.gif'],
            allowedMentions: {
                parse: [],
                users: [],
                roles: [],
                repliedUser: true
            }
        });
        if (isSlash) {
            wheelMessage = message;
            wheelMessage.edit = message.editReply;
        }

        const percentage = (1 / options.length) * 100; // Calculate the percentage

        const wheelResultBase = await loadImage('assets/wheel_finished.png');
        const canvas = createCanvas(wheelResultBase.width, wheelResultBase.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(wheelResultBase, 0, 0);
        ctx.font = `28px Sans`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = 'black';
        ctx.fillText(chosenOption, 128, 85, 240);
        ctx.font = `10px Sans`;
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillStyle = 'white';
        ctx.fillText(`Requested by ${message.author.tag} | ${percentage.toFixed(2)}%`, 4, 256, 256 - 4);
        const attachment = new discord.MessageAttachment(canvas.toBuffer("image/png"), 'wheel_result.png');

        setTimeout(() => {
            wheelMessage.edit({
                content: `🎡 The wheel has chosen: **${chosenOption}**! 🎉`,
                files: [attachment],
                allowedMentions: {
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: true
                }
            });
        }, 1750);
    }
}

// Export the WheelCommand class
module.exports = WheelCommand;