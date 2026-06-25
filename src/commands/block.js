const discord = require("discord.js");

const ScratchBlocks = require("../util/scratchblocks.js");
const OptionType = require('../util/optiontype');

class Command {
    constructor() {
        this.name = "block";
        this.description = "Generate images of blocks from [scratchblocks syntax](https://en.scratch-wiki.info/wiki/Block_Plugin/Syntax)";
        this.slashDescription = "Generate images of blocks from scratchblocks syntax";
        this.example = [
            { text: `{{prefix}}block <pen is down?::pen>`, image: "block_example1.png" }
        ];
        this.attributes = {
            permission: 0,
        };
        this.slash = {
            options: [{
                type: OptionType.STRING,
                name: 'text',
                required: true,
                description: 'Text to create a block from.'
            }]
        };
    }

    convertSlashCommand(interaction) {
        const text = `${interaction.options.getString('text')}`;
        return [interaction, text.split(' ')];
    }

    async invoke(message, args) {
        if (!args[0]) return message.reply('Please provide blocks written in [scratchblocks syntax](https://en.scratch-wiki.info/wiki/Block_Plugin/Syntax).');

        try {
            const renderedBuffer = await ScratchBlocks.render(args.join(" "));
            if (!renderedBuffer)
                return message.reply('The resulting image is blank.'
                    + "\n" + 'Please provide blocks written in [scratchblocks syntax](https://en.scratch-wiki.info/wiki/Block_Plugin/Syntax).');
            message.reply({
                content: `-# Rendered by <@${message.author.id}>`,
                files: [renderedBuffer]
            });
        } catch (err) {
            if (`${err}`.includes("error while reading from input stream"))
                return message.reply("That script is too complicated for me to render it properly."
                    + " " + 'Make sure you are entering valid [scratchblocks syntax](https://en.scratch-wiki.info/wiki/Block_Plugin/Syntax).');
            throw err;
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
