const fs = require("fs/promises");
const path = require("path");

const uuid = require("uuid");
const discord = require("discord.js");
const { Jimp, JimpMime } = require('jimp');

const OptionType = require('../util/optiontype.js');
const runNewThread = require("../util/multi-thread.js");
const BaseCommand = require("../classes/base-command.js");

const pizzaToppings = require("../resources/pizza-toppings.json");

const titleCase = (text = '') => {
    text = String(text);
    return text.charAt(0).toUpperCase() + text.substring(1);
};

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "pizza";
        this.description = "Make a pizza with toppings.";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };
        this.example = [
            { text: `{{prefix}}pizza pepperoni`, image: "pizza_example1.png" },
            { text: `{{prefix}}pizza toppings` },
            { text: `{{prefix}}pizza` },
        ];
        this.slash = {
            options: [{
                type: OptionType.STRING,
                name: 'toppings',
                required: true,
                description: 'A list of toppings, seperated by commas. Type "list" to see toppings.'
            }]
        };
    }

    convertSlashCommand(interaction) {
        const toppings = interaction.options.getString('toppings');
        const split = toppings.split(/[,\s]+/).filter(topping => !!topping);
        return [interaction, split, true];
    }

    async invoke(message, args, isSlash) {
        isSlash = isSlash === true;
        if (args[0] === 'toppings' || args[0] === 'help' || args[0] === 'list') {
            const embed = new discord.MessageEmbed()
                .setColor('RED')
                .setDescription(`${pizzaToppings.toppingsPublic.map(topping => `- **${titleCase(topping)}**`).join('\n')}`)
                .setFooter({ text: 'Type these toppings after the command to add them to your pizza.' })
                .setTitle('🍕 Toppings List');
            return message.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        // validate args and convert them if they are a nickname
        const validArguments = args
            .map(arg => `${arg}`.toLowerCase())
            .map(arg => pizzaToppings.toppingConversions[arg] || arg)
            .filter(arg => pizzaToppings.toppingsAll.includes(arg));
        if (validArguments.length <= 0) {
            for (let i = 0; i < 7; i++) {
                const randomTopping = pizzaToppings.toppingsPublic[Math.floor(Math.random() * pizzaToppings.toppingsPublic.length)];
                validArguments.push(randomTopping);
            }
        }
        if (validArguments.length > 512)
            return message.reply('There are too many toppings on this pizza.\nYou can only add up to 512 toppings at once.');
        
        // initial defer
        const username = message?.member?.displayName
            || message?.member?.username
            || message?.author?.username
            || "User";
        let respondedMessage = await message.reply({
            content: `*\`\`Cooking up your ${validArguments.join(' ')} pizza...\`\`*`.substring(0, 2000),
            files: ['./assets/pizzaloading.gif'],
            allowedMentions: { // ping NO ONE. this can DEFINETLY be abused if we did allow pings
                parse: [],
                users: [],
                roles: [],
                repliedUser: true
            }
        });
        if (isSlash) {
            respondedMessage = message;
            respondedMessage.edit = message.editReply;
        }

        // create the pizza
        const requestId = uuid.v4();
        const tempPath = path.join(__dirname, `../../temp/pizza-${requestId}.png`);
        try {
            await runNewThread(path.join(__dirname, "../resources/worker/pizza.worker.js"), path.join(__dirname, __filename), {
                filePath: tempPath,
                toppings: validArguments,
            });

            // Send the image
            const buffer = await fs.readFile(tempPath);
            const attachment = new discord.MessageAttachment(buffer, 'pizza.png');
            await respondedMessage.edit({
                content: (`🍕 **${username}'${username.toLowerCase().endsWith('s') ? '' : 's'} Pizza** 🍕`
                    + "\n" + `${validArguments.map(arg => titleCase(arg)).join(', ')}`).substring(0, 2000),
                files: [attachment],
                allowedMentions: { // ping NO ONE. this can DEFINETLY be abused if we did allow pings
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: true
                }
            });
        } catch (error) {
            console.error(error);
            await respondedMessage.edit({
                content: `An error occurred while creating the pizza. ❌\n${error}`,
                files: [],
            });
        } finally {
            await fs.rm(tempPath, { force: true });
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
