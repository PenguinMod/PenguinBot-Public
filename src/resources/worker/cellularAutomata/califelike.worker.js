const fs = require('fs/promises');
const path = require('path');

const Canvas = require('canvas');
const GIFEncoder = require('gifencoder');

const CellularAutomataLifeLike = require("../../../util/cellularAutomata/lifeLike.js");

const simulateAndRender = async (serializableData) => {
    const { bornAt, surviveAt, tempDir, imagePath } = serializableData;
    
    // start the drawing segment & craete the sim board
    const width = 256;
    const height = 256;
    const image = await Canvas.loadImage(imagePath);
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);
    // Resize and center the image within 256x256 bounds while preserving aspect ratio
    // DISCLOSURE: i think its obvious what im writing this for
    const scale = Math.min(1, width / image.width, height / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2;
    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

    // get this as black & white
    // DISCLOSURE: This segment is AI
    const imageData = ctx.getImageData(0, 0, 256, 256);
    const data = imageData.data;

    // Build a 2D array of booleans where true represents white (brightness > 128)
    // DISCLOSURE: This segment is AI
    const pixelArray = [];
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];
            // thius should to account for alpha where transparent imgs or leftover alpha 0 pixels can cause issues
            const brightness = ((r + g + b) / 3) * (a / 255);
            row.push(brightness > 128);
        }
        pixelArray.push(row);
    }

    // create the simulation & render
    const encoder = new GIFEncoder(width, height);
    const simulation = new CellularAutomataLifeLike(bornAt, surviveAt, pixelArray);
    encoder.start();
    encoder.setRepeat(0); // 0 means "to repeat"
    encoder.setDelay(Math.round(1000 / 12)); // 12 FPS?
    encoder.setQuality(30);

    // DISCLOSURE: all the drawing optimizations are ai because my attempts were futile
    const data32 = new Uint32Array(imageData.data.buffer);
    let flatMap = new Uint8Array(width * height);
    const colorEmpty = -16381423; // "#110A06";
    const colorAlive = -1707009;  // "#FFF3E5"; 

    // step & draw each iteration
    let iteration = 0;
    let stagnantIterations = 0;
    while (iteration < 256 && stagnantIterations < 32) {
        // step this iteration
        simulation.iterate();
        iteration++;
        if (simulation.stagnant) {
            stagnantIterations++;
        } else {
            stagnantIterations = 0;
        }

        // draw this iteration
        // DISCLOSURE: ai optimization
        const map = simulation.map;
        for (let y = 0; y < height; y++) {
            const row = map[y];
            const rowOffset = y * width;
            for (let x = 0; x < width; x++) {
                flatMap[rowOffset + x] = row[x] ? 1 : 0;
            }
        }
        // Write to pixel buffer using 32-bit values
        for (let i = 0; i < flatMap.length; i++) {
            data32[i] = flatMap[i] ? colorAlive : colorEmpty;
        }

        ctx.putImageData(imageData, 0, 0);
        encoder.addFrame(ctx);
    }

    // we're done
    encoder.finish();

    const gif = encoder.out.getData();
    const gifPath = path.join(tempDir, `simulation.gif`);
    await fs.writeFile(gifPath, gif);
    return {
        gifPath: gifPath,
        iterations: iteration,
        stagnantIterations: stagnantIterations,
    };
};
const runWorker = async (data) => {
    return await simulateAndRender(data);
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
