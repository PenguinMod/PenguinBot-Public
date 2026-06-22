const fs = require('fs');
const path = require('path');

const Canvas = require('@napi-rs/canvas')
const GIFEncoder = require('gifencoder');
const decodeGif = require("../util/decode-gif");

const processGif = async (data) => {
    const { workerSrc, commandSrc, tempDir, imagePath, usingGif, width, height, args, serializableData } = data;
    
    const commandModule = require(commandSrc);
    const commandClass = new commandModule();

    let image = null;
    if (imagePath) {
        const buffer = await fs.readFileSync(imagePath);
        if (usingGif) {
            image = await decodeGif(buffer, "canvas");
        } else {
            // NOTE: we dont pass the path in because we dont want to infer file type by file name
            image = await Canvas.loadImage(buffer);
        }
    }
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const encoder = new GIFEncoder(width, height);
    if (commandClass.initialize) {
        await commandClass.initialize(Canvas, canvas, ctx, encoder, args, serializableData);
    }

    const buffer = await commandClass.drawGif(ctx, encoder, image, usingGif, width, height, args, serializableData);
    const framePath = path.join(tempDir, `edited.gif`);
    fs.writeFileSync(framePath, buffer);
};

const runWorker = async (data) => {
    return await processGif(data);
};

// FYI, Canvas support is very rough with worker_threads for some reason. We use child_process to work around that.
process.on('message', async (data) => {
    try {
        await runWorker(data);
        process.send({ success: true });
    } catch (err) {
        process.send({ success: false, error: err.message });
    } finally {
        // this process wont close by itself, so we exit with code 0 to denote we successfully finished everything
        process.exit(0);
    }
});

module.exports = runWorker;