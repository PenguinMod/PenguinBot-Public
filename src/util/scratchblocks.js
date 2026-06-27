const fs = require("fs/promises");
const path = require("path");

const uuid = require('uuid');
const canvas = require('canvas');
const { JSDOM } = require("jsdom");

const env = require("./env-util.js");
const makePng = require("./make-png.js");
const runNewThread = require('./multi-thread.js');

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
const delay = (ms) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
};

class ScratchBlocks {
    /** @private @param {string} scratchblocksString */
    static async _render(scratchblocksString) {
        if (!scratchblocksString) return;
        while (!scratchblocks) await delay(100);

        // make the dom
        const dom = new JSDOM(`<pre class='blocks'>${xmlEscape(scratchblocksString)}</pre>`);
        const scratchBlocksInstance = scratchblocks(dom.window);
        scratchBlocksInstance.appendStyles();
        scratchBlocksInstance.renderMatching("pre.blocks", {
            style: "scratch3",
            languages: ["en"]
        });

        const scratchBlocksDiv = dom.window.document.querySelector("div.scratchblocks");
        const svgElement = scratchBlocksDiv.getElementsByTagName('svg').item(0);

        // resize image, or return early if there is no image
        let newWidth = Math.ceil(Number(svgElement.getAttribute('width')) * 2);
        let newHeight = Math.ceil(Number(svgElement.getAttribute('height')) * 2);
        if (newWidth < 1 || newHeight < 1) return;
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
        const styleTag1 = svgElement.appendChild(dom.window.document.createElement('style'));
        styleTag1.innerHTML = `.sb3-comment-label {
            fill: black !important;
        }
        * {
            font: 500 12pt "Helvetica Neue", "Helvetica 65 Medium", Helvetica Neue, Helvetica, sans-serif;
        }`;
        const styleTag2 = svgElement.appendChild(dom.window.document.createElement('style'));
        styleTag2.innerHTML = dom.window.document.head.innerHTML;
        const styleTag3 = svgElement.appendChild(dom.window.document.createElement('style'));
        styleTag3.innerHTML = scratchBlocksInstance.scratch3.stylee.cssContent;

        // get svg data
        const svgData = scratchBlocksDiv.innerHTML;
        const uri = 'data:image/svg+xml;base64,' + Buffer.from(svgData, 'utf8').toString('base64url');
        const image = await canvas.loadImage(uri);
        const drawingCanvas = canvas.createCanvas(image.width, image.height);
        const ctx = drawingCanvas.getContext('2d');
        ctx.drawImage(image, 0, 0, image.width, image.height);
        return await drawingCanvas.toBuffer("image/png");
    }

    /**
     * Renders Scratch blocks with scratchblocks. 
     * @param {string} scratchblocksString The scratchblocks text to render.
     * @throws Throws when any parsing step fails.
     * @returns {Promise<Buffer>} PNG with the rendered scratchblocks, or null if nothing was rendered.
     */
    static async render(scratchblocksString) {
        if (env.getBool("DISABLE_FORKING"))
            return await this._render(scratchblocksString);

        // Create a new thread and assign it a temp file to use for the png
        const requestId = uuid.v4();
        const tempFile = path.join(__dirname, `../../temp/block-${requestId}.png`);
        const workerPath = path.join(__dirname, "../resources/worker/scratchblocks.worker.js");
        await runNewThread(workerPath, path.resolve(__dirname, __filename), {
            requestId,
            tempFile,
            scratchblocksString
        });
        
        let pngBuffer = null;
        try {
            const buffer = await fs.readFile(tempFile);
            await fs.rm(tempFile);
            pngBuffer = buffer;
        } catch {
            // assume the file just wasnt made (width < 0 likely)
            return;
        }

        // NOTE: Sometimes the png file becomes filled with data but is unreadable in some way. This is an attempt to mitigate that.
        return await makePng(pngBuffer);
    }
}

module.exports = ScratchBlocks;
