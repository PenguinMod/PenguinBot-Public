const { Resvg } = require('@resvg/resvg-js');
const { GlobalFonts } = require('@napi-rs/canvas');
const { parseHTML } = require('linkedom');
const path = require('path');
const OptionType = require('../util/optiontype');

GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/HelveticaNeue-Medium.otf'), 'Helvetica Neue'); // we need this bcs @resvg/resvg-js doesnt like fonts pls dont remove

let scratchblocks;
(async () => {
    scratchblocks = await import("../modules/scratchblocks/index.js");
    scratchblocks = scratchblocks.default;
})();

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class Command {
    constructor(_, state) {
        this.name = "block";
        this.description = "Generate images of blocks from [scratchblocks syntax](https://en.scratch-wiki.info/wiki/Block_Plugin/Syntax)";
        this.slashdescription = "Generate images of blocks from scratchblocks syntax";
        this.example = [
            { text: `${state.prefix}block <pen is down?::pen>`, image: "block_example1.png" }
        ];
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: false,
            unlockedChannels: [
                "1090809014343974972",
                "1181103736685350983",
                "1038248289830711406",
                "1038249236552237167",
                "1181097377730400287",
            ],
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
        if (!scratchblocks) await wait(500);
        if (!args[0]) return message.reply('Please provide blocks written in [scratchblocks syntax](https://en.scratch-wiki.info/wiki/Block_Plugin/Syntax).');

        const { window } = parseHTML(`<!DOCTYPE html><html><head></head><body></body></html>`);

        const sb = scratchblocks(window);

        const doc = sb.parse(args.join(' '), {
            style: "scratch3",
            languages: ["en"]
        });
        const view = sb.newView(doc, { style: "scratch3", scale: 1 });
        const svgEl = view.render();

        let newWidth = view.width;
        let newHeight = view.height;

        if (newWidth < 1 || newHeight < 1) {
            return message.reply('The resulting image is blank.\nPlease provide blocks written in [scratchblocks syntax](https://en.scratch-wiki.info/wiki/Block_Plugin/Syntax).');
        }
        if (newWidth > 4096) {
            const divisor = newWidth / 4096;
            newWidth = Math.ceil(newWidth / divisor);
            newHeight = Math.ceil(newHeight / divisor);
        }
        if (newHeight > 4096) {
            const divisor = newHeight / 4096;
            newWidth = Math.ceil(newWidth / divisor);
            newHeight = Math.ceil(newHeight / divisor);
        }

        const styleEl = sb.scratch3.makeStyle();
        view.defs.appendChild(styleEl);
        let svgData = svgEl.outerHTML;
        view.defs.removeChild(styleEl);

        if (!svgData.includes('xmlns=')) {
            svgData = svgData.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
        }

        // console.log(svgData)

        const resvg = new Resvg(svgData, {
            fitTo: { mode: 'width', value: newWidth * 2 },
            font: {
                fontFiles: [path.join(__dirname, '../../assets/fonts/HelveticaNeue-Medium.otf')],
                loadSystemFonts: false,
            },
        });
        const pngBuffer = resvg.render().asPng();

        message.reply({ files: [pngBuffer] });
    }
}

module.exports = Command;