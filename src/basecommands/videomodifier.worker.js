const fs = require('fs');
const path = require('path');

const Canvas = require('canvas');

const processFrames = async (data) => {
    const { workerSrc, commandSrc, tempDir, imagePath, frameCount, frameRate, width, height, args, serializableData } = data;
    
    const commandModule = require(commandSrc);
    const commandClass = new commandModule();

    let image = null;
    if (imagePath) {
        // NOTE: we dont pass the path in because we dont want to infer file type by file name
        const buffer = await fs.readFileSync(imagePath);
        image = await Canvas.loadImage(buffer);
    }
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    if (commandClass.initialize) {
        await commandClass.initialize(Canvas, canvas, ctx, args, serializableData);
    }

    for (let i = 0; i < frameCount; i++) {
        commandClass.drawFrame(ctx, image, i, frameCount, frameRate, width, height, args, serializableData);

        const framePath = path.join(tempDir, `frame${String(i).padStart(6, '0')}.png`);
        fs.writeFileSync(framePath, canvas.toBuffer("image/png"));
    }
};

const runWorker = async (data) => {
    return await processFrames(data);
};

// FYI, Canvas support is very rough with worker_threads for some reason. We use child_process to work around that.
process.on('message', async (data) => {
    try {
        const result = await runWorker(data);
        process.send({ success: true, result: result });
    } catch (err) {
        process.send({ success: false, error: err.message });
    } finally {
        // this process wont close by itself, so we exit with code 0 to denote we successfully finished everything
        process.exit(0);
    }
});

module.exports = runWorker;