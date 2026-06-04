const GifModifierCommand = require('../../basecommands/gifmodifier');
const path = require("path");

// frameSet should align with eat_sheet.png
const frameSet = [
    { x: 0 , y: 0 , },
    { x: 1 , y: 0 , },
    { x: 2 , y: 0 , },
    { x: 3 , y: 0 , },
    { x: 4 , y: 0 , },
    { x: 5 , y: 0 , },
    { x: 6 , y: 0 , },
    { x: 7 , y: 0 , },
    { x: 0 , y: 1 , },
    { x: 1 , y: 1 , },
    { x: 2 , y: 1 , },
    { x: 3 , y: 1 , },
    { x: 4 , y: 1 , },
    { x: 5 , y: 1 , },
    { x: 6 , y: 1 , },
    { x: 7 , y: 1 , },
    { x: 0 , y: 2 , },
    { x: 1 , y: 2 , },
    { x: 2 , y: 2 , },
    { x: 3 , y: 2 , },
    { x: 4 , y: 2 , },
    { x: 5 , y: 2 , },
    { x: 6 , y: 2 , },
    { x: 7 , y: 2 , },
    { x: 0 , y: 3 , },
    { x: 1 , y: 3 , },
    { x: 2 , y: 3 , },
    { x: 3 , y: 3 , },
    { x: 4 , y: 3 , },
    { x: 5 , y: 3 , },
    { x: 6 , y: 3 , },
    { x: 7 , y: 3 , },
    { x: 0 , y: 4 , },
    { x: 1 , y: 4 , },
    { x: 2 , y: 4 , },
    { x: 3 , y: 4 , },
    { x: 4 , y: 4 , },
    { x: 5 , y: 4 , },
    { x: 6 , y: 4 , },
    { x: 7 , y: 4 , },
    { x: 0 , y: 5 , },
    { x: 1 , y: 5 , },
    { x: 2 , y: 5 , },
    { x: 3 , y: 5 , },
    { x: 4 , y: 5 , },
    { x: 5 , y: 5 , },
    { x: 6 , y: 5 , },
    { x: 7 , y: 5 , },
    { x: 0 , y: 6 , },
    { x: 1 , y: 6 , },
    { x: 2 , y: 6 , },
    { x: 3 , y: 6 , },
    { x: 4 , y: 6 , },
    { x: 5 , y: 6 , },
    { x: 6 , y: 6 , },
    { x: 7 , y: 6 , },
    { x: 0 , y: 7 , },
    { x: 1 , y: 7 , },
    { x: 2 , y: 7 , },
    { x: 3 , y: 7 , },
    { x: 4 , y: 7 , },
    { x: 5 , y: 7 , },
    { x: 6 , y: 7 , },
    { x: 7 , y: 7 , },
    { x: 0 , y: 8 , },
    { x: 1 , y: 8 , },
    { x: 2 , y: 8 , },
    { x: 3 , y: 8 , },
    { x: 4 , y: 8 , },
    { x: 5 , y: 8 , },
    { x: 6 , y: 8 , },
    { x: 7 , y: 8 , },
    { x: 0 , y: 9 , },
    { x: 1 , y: 9 , },
    { x: 2 , y: 9 , },
    { x: 3 , y: 9 , },
    { x: 4 , y: 9 , },
    { x: 5 , y: 9 , },
    { x: 6 , y: 9 , },
    { x: 7 , y: 9 , },
    { x: 0 , y: 10, },
    { x: 1 , y: 10, },
    { x: 2 , y: 10, },
    { x: 3 , y: 10, },
    { x: 4 , y: 10, },
    { x: 5 , y: 10, },
    { x: 6 , y: 10, },
    { x: 7 , y: 10, },
    { x: 0 , y: 11, },
    { x: 1 , y: 11, },
    { x: 2 , y: 11, },
    { x: 3 , y: 11, },
    { x: 4 , y: 11, },
    { x: 5 , y: 11, },
    { x: 6 , y: 11, },
    { x: 7 , y: 11, },
    { x: 0 , y: 12, },
    { x: 1 , y: 12, },
    { x: 2 , y: 12, },
    { x: 3 , y: 12, },
    { x: 4 , y: 12, },
    { x: 5 , y: 12, },
    { x: 6 , y: 12, },
    { x: 7 , y: 12, },
];

const drawImageForEat = (ctx, image, x, y, w, h) => {
    // i dont feel like redoing all of the positions so instead just do this
    const scale = 1.7;
    const midX = (x + (x + w)) / 2;
    const midY = (y + (y + h)) / 2;
    const newW = w * scale;
    const newH = h * scale;
    const newX = midX - (newW / 2);
    const newY = midY - (newH / 2);

    ctx.fillStyle = "white";
    ctx.fillRect(newX, newY, newW, newH);
    ctx.drawImage(image, newX, newY, newW, newH);
};

class Command extends GifModifierCommand {
    // NOTE: Constructor will be called as a new instance of this class is made when "initialize" happens.
    // New instances are made by the "Editing video" thread to reduce performance impact when running videomodifier commands.
    constructor() {
        super();
        this.name = "eat";
        this.description = "Makes a GIF of eating your image.";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };

        this.commandScript = path.join(__dirname, "./eat.js");
        this.requiresImage = true;
        this.supportsGif = true;

        this.frameSheetImage = null;
    }

    async initialize(Canvas) {
        this.frameSheetImage = await Canvas.loadImage('./assets/eat_sheet.png');
    }
    getGIFWidthHeight() {
        return [480, 270];
    }

    async drawGif(ctx, encoder, image, usingGif, width, height, args) {
        encoder.start();
        encoder.setRepeat(0); // 0 means "to repeat"
        encoder.setDelay(30); // 30ms delay in the original

        let gifFrameCount = 0;
        if (usingGif) {
            gifFrameCount = image.reader.numFrames();
        }

        // rendering in 1.5x res because it looks better
        for (let i = 0; i < frameSet.length; i++) {
            const frame = frameSet[i];
            const xMult = 320; // width of each frame
            const yMult = 180; // height of each frame
            ctx.drawImage(this.frameSheetImage, frame.x * xMult, frame.y * yMult, xMult, yMult, 0, 0, 480, 270);

            let drawingImage = image;
            if (usingGif) {
                const frame = image.frames[i % gifFrameCount];
                drawingImage = frame;
            }

            if (i === 0) drawImageForEat(ctx, drawingImage, 163, 172, 41, 40);
            if (i === 1) drawImageForEat(ctx, drawingImage, 169, 163, 41, 40);
            if (i === 2) drawImageForEat(ctx, drawingImage, 160, 136, 41, 40);
            if (i === 3) drawImageForEat(ctx, drawingImage, 157, 128, 41, 40);
            if (i === 4) drawImageForEat(ctx, drawingImage, 142, 116, 41, 40);
            if (i === 5) drawImageForEat(ctx, drawingImage, 129, 117, 41, 40);
            if (i === 6) drawImageForEat(ctx, drawingImage, 126, 120, 41, 40);
            if (i === 7) drawImageForEat(ctx, drawingImage, 125, 128, 41, 40);

            if (i === 8) drawImageForEat(ctx, drawingImage, 126, 133, 41, 40);
            if (i === 9) drawImageForEat(ctx, drawingImage, 132, 133, 41, 40);
            if (i === 10) drawImageForEat(ctx, drawingImage, 140, 130, 41, 40);
            if (i === 11) drawImageForEat(ctx, drawingImage, 143, 127, 41, 40);
            if (i === 12) drawImageForEat(ctx, drawingImage, 140, 127, 41, 40);
            if (i === 13) drawImageForEat(ctx, drawingImage, 134, 132, 41, 40);
            if (i === 14) drawImageForEat(ctx, drawingImage, 131, 137, 41, 40);
            if (i === 15) drawImageForEat(ctx, drawingImage, 128, 142, 41, 40);

            if (i === 16) drawImageForEat(ctx, drawingImage, 124, 149, 41, 40);
            if (i === 17) drawImageForEat(ctx, drawingImage, 123, 158, 41, 40);
            if (i === 18) drawImageForEat(ctx, drawingImage, 121, 165, 41, 40);
            if (i === 19) drawImageForEat(ctx, drawingImage, 118, 173, 41, 40);
            if (i === 20) drawImageForEat(ctx, drawingImage, 121, 184, 41, 40);
            if (i === 21) drawImageForEat(ctx, drawingImage, 125, 194, 41, 40);
            if (i === 22) drawImageForEat(ctx, drawingImage, 138, 201, 41, 40);
            if (i === 23) drawImageForEat(ctx, drawingImage, 151, 206, 41, 40);

            if (i === 24) drawImageForEat(ctx, drawingImage, 163, 210, 41, 40);
            if (i === 25) drawImageForEat(ctx, drawingImage, 177, 207, 41, 40);
            if (i === 26) drawImageForEat(ctx, drawingImage, 184, 204, 41, 40);
            if (i === 27) drawImageForEat(ctx, drawingImage, 202, 192, 41, 40);
            if (i === 28) drawImageForEat(ctx, drawingImage, 210, 178, 41, 40);
            if (i === 29) drawImageForEat(ctx, drawingImage, 216, 167, 38, 36);
            if (i === 30) drawImageForEat(ctx, drawingImage, 218, 158, 36, 31);
            if (i === 31) drawImageForEat(ctx, drawingImage, 219, 149, 32, 31);

            if (i === 32) drawImageForEat(ctx, drawingImage, 218, 138, 34, 32);
            if (i === 33) drawImageForEat(ctx, drawingImage, 217, 135, 33, 29);
            if (i === 34) drawImageForEat(ctx, drawingImage, 216, 132, 33, 30);
            if (i === 35) drawImageForEat(ctx, drawingImage, 218, 132, 31, 28);
            if (i === 36) drawImageForEat(ctx, drawingImage, 217, 132, 32, 28);
            if (i === 37) drawImageForEat(ctx, drawingImage, 217, 132, 32, 28);
            if (i === 38) drawImageForEat(ctx, drawingImage, 217, 132, 32, 28);
            if (i === 39) drawImageForEat(ctx, drawingImage, 220, 130, 31, 28);

            if (i === 40) drawImageForEat(ctx, drawingImage, 219, 131, 30, 25);
            if (i === 41) drawImageForEat(ctx, drawingImage, 219, 131, 31, 25);
            if (i === 42) drawImageForEat(ctx, drawingImage, 219, 131, 31, 25);
            if (i === 43) drawImageForEat(ctx, drawingImage, 221, 130, 30, 21);
            if (i === 44) drawImageForEat(ctx, drawingImage, 222, 131, 29, 20);
            if (i === 45) drawImageForEat(ctx, drawingImage, 223, 131, 29, 16);
            if (i === 46) drawImageForEat(ctx, drawingImage, 225, 132, 27, 11);
            if (i === 47) drawImageForEat(ctx, drawingImage, 224, 131, 27, 12);

            if (i === 48) drawImageForEat(ctx, drawingImage, 225, 134, 25, 7);
            if (i === 49) drawImageForEat(ctx, drawingImage, 231, 133, 18, 5);
            
            encoder.addFrame(ctx);
        }
        
        encoder.finish();
        return encoder.out.getData();
    }
}

module.exports = Command;