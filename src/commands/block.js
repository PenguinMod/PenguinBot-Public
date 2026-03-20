const discord = require("discord.js");
const canvas = require('canvas');
const jsdom = require("jsdom");
const OptionType = require('../util/optiontype');
const { JSDOM } = jsdom;
let scratchblocks;

(async () => {
    scratchblocks = await import("../modules/scratchblocks/index.js");
    scratchblocks = scratchblocks.default;
})();

const xmlEscape = function (unsafe) {
    return unsafe.replace(/[<>&'"]/g, c => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
};
const wait = (ms) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
};

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
            admin: false,
            lockedToCommands: false,
            unlockedChannels: [
                "1090809014343974972", // help channel
                "1181103736685350983", // tutorials
                "1038248289830711406", // bug reports
                "1038249236552237167", // suggestions
                "1181097377730400287", // spaces
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
        const window = new JSDOM(`<pre class='blocks'>${xmlEscape(args.join(' '))}</pre>`);
        const scratchBlocksInstance = scratchblocks(window.window);
        scratchBlocksInstance.appendStyles();
        scratchBlocksInstance.renderMatching("pre.blocks", {
            style: "scratch3",
            languages: ["en"]
        });
        const scratchBlocksDiv = window.window.document.querySelector("div.scratchblocks");
        const svgElement = scratchBlocksDiv.getElementsByTagName('svg').item(0);
        let newWidth = Math.ceil(Number(svgElement.getAttribute('width')) * 2);
        let newHeight = Math.ceil(Number(svgElement.getAttribute('height')) * 2);
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
        svgElement.setAttribute('width', String(newWidth));
        svgElement.setAttribute('height', String(newHeight));
        svgElement.setAttribute('viewbox', `0 0 ${newWidth} ${newHeight}`);
        // add extra style tags & stuff
        const styleTag1 = svgElement.appendChild(window.window.document.createElement('style'));
        styleTag1.innerHTML = `.sb3-comment-label {
    fill: black !important;
}
* {
    font: 500 12pt "Helvetica Neue", "Helvetica 65 Medium", Helvetica Neue, Helvetica, sans-serif;
}`;
        const styleTag2 = svgElement.appendChild(window.window.document.createElement('style'));
        styleTag2.innerHTML = window.window.document.head.innerHTML;
        const styleTag3 = svgElement.appendChild(window.window.document.createElement('style'));
        styleTag3.innerHTML = scratchBlocksInstance.scratch3.stylee.cssContent;
        // get svg data
        const svgData = scratchBlocksDiv.innerHTML;
        const uri = 'data:image/svg+xml;base64,' + Buffer.from(svgData, 'utf8').toString('base64url');
        const image = await canvas.loadImage(uri);
        const drawingCanvas = canvas.createCanvas(image.width, image.height);
        const ctx = drawingCanvas.getContext('2d');
        ctx.drawImage(image, 0, 0, image.width, image.height);
        message.reply({
            files: [drawingCanvas.toBuffer("image/png")]
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
