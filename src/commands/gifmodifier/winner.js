const GifModifierCommand = require('../../basecommands/gifmodifier');
const path = require("path");

// frameSet should align with redditgold_sheet.jpg
const frameSet = [
    { x: 0 , y: 0 , },
    { x: 1 , y: 0 , },
    { x: 2 , y: 0 , },
    { x: 3 , y: 0 , },
    { x: 4 , y: 0 , },
    { x: 5 , y: 0 , },
    { x: 6 , y: 0 , },
    { x: 7 , y: 0 , },
    { x: 8 , y: 0 , },
    { x: 9 , y: 0 , },
    { x: 10, y: 0 , },
    { x: 11, y: 0 , },
    { x: 0 , y: 1 , },
    { x: 1 , y: 1 , },
    { x: 2 , y: 1 , },
    { x: 3 , y: 1 , },
    { x: 4 , y: 1 , },
    { x: 5 , y: 1 , },
    { x: 6 , y: 1 , },
    { x: 7 , y: 1 , },
    { x: 8 , y: 1 , },
    { x: 9 , y: 1 , },
    { x: 10, y: 1 , },
    { x: 11, y: 1 , },
    { x: 0 , y: 2 , },
    { x: 1 , y: 2 , },
    { x: 2 , y: 2 , },
    { x: 3 , y: 2 , },
    { x: 4 , y: 2 , },
    { x: 5 , y: 2 , },
    { x: 6 , y: 2 , },
    { x: 7 , y: 2 , },
    { x: 8 , y: 2 , },
    { x: 9 , y: 2 , },
    { x: 10, y: 2 , },
    { x: 11, y: 2 , },
    { x: 0 , y: 3 , },
    { x: 1 , y: 3 , },
    { x: 2 , y: 3 , },
    { x: 3 , y: 3 , },
    { x: 4 , y: 3 , },
    { x: 5 , y: 3 , },
    { x: 6 , y: 3 , },
    { x: 7 , y: 3 , },
    { x: 8 , y: 3 , },
    { x: 9 , y: 3 , },
    { x: 10, y: 3 , },
    { x: 11, y: 3 , },
    { x: 0 , y: 4 , },
    { x: 1 , y: 4 , },
    { x: 2 , y: 4 , },
    { x: 3 , y: 4 , },
    { x: 4 , y: 4 , },
    { x: 5 , y: 4 , },
    { x: 6 , y: 4 , },
    { x: 7 , y: 4 , },
    { x: 8 , y: 4 , },
    { x: 9 , y: 4 , },
    { x: 10, y: 4 , },
    { x: 11, y: 4 , },
    { x: 0 , y: 5 , },
    { x: 1 , y: 5 , },
    { x: 2 , y: 5 , },
    { x: 3 , y: 5 , },
    { x: 4 , y: 5 , },
    { x: 5 , y: 5 , },
    { x: 6 , y: 5 , },
    { x: 7 , y: 5 , },
    { x: 8 , y: 5 , },
    { x: 9 , y: 5 , },
    { x: 10, y: 5 , },
    { x: 11, y: 5 , },
    { x: 0 , y: 6 , },
    { x: 1 , y: 6 , },
    { x: 2 , y: 6 , },
    { x: 3 , y: 6 , },
    { x: 4 , y: 6 , },
    { x: 5 , y: 6 , },
    { x: 6 , y: 6 , },
    { x: 7 , y: 6 , },
    { x: 8 , y: 6 , },
    { x: 9 , y: 6 , },
    { x: 10, y: 6 , },
    { x: 11, y: 6 , },
    { x: 0 , y: 7 , },
    { x: 1 , y: 7 , },
    { x: 2 , y: 7 , },
    { x: 3 , y: 7 , },
    { x: 4 , y: 7 , },
    { x: 5 , y: 7 , },
    { x: 6 , y: 7 , },
    { x: 7 , y: 7 , },
    { x: 8 , y: 7 , },
    { x: 9 , y: 7 , },
    { x: 10, y: 7 , },
    { x: 11, y: 7 , },
    { x: 0 , y: 8 , },
    { x: 1 , y: 8 , },
    { x: 2 , y: 8 , },
    { x: 3 , y: 8 , },
    { x: 4 , y: 8 , },
    { x: 5 , y: 8 , },
    { x: 6 , y: 8 , },
    { x: 7 , y: 8 , },
    { x: 8 , y: 8 , },
    { x: 9 , y: 8 , },
    { x: 10, y: 8 , },
    { x: 11, y: 8 , },
    { x: 0 , y: 9 , },
    { x: 1 , y: 9 , },
    { x: 2 , y: 9 , },
    { x: 3 , y: 9 , },
    { x: 4 , y: 9 , },
    { x: 5 , y: 9 , },
    { x: 6 , y: 9 , },
    { x: 7 , y: 9 , },
    { x: 8 , y: 9 , },
    { x: 9 , y: 9 , },
    { x: 10, y: 9 , },
    { x: 11, y: 9 , },
    { x: 0 , y: 10, },
    { x: 1 , y: 10, },
    { x: 2 , y: 10, },
    { x: 3 , y: 10, },
    { x: 4 , y: 10, },
    { x: 5 , y: 10, },
    { x: 6 , y: 10, },
    { x: 7 , y: 10, },
    { x: 8 , y: 10, },
    { x: 9 , y: 10, },
    { x: 10, y: 10, },
    { x: 11, y: 10, },
    { x: 0 , y: 11, },
    { x: 1 , y: 11, },
    { x: 2 , y: 11, },
    { x: 3 , y: 11, },
    { x: 4 , y: 11, },
    { x: 5 , y: 11, },
    { x: 6 , y: 11, },
    { x: 7 , y: 11, },
    { x: 8 , y: 11, },
    { x: 9 , y: 11, },
    { x: 10, y: 11, },
    { x: 11, y: 11, },
];

const sine = (x) => {
    return -(Math.cos(Math.PI * x) - 1) / 2;
};
const constrain = (num, min, max) => {
    return Math.min(Math.max(num, min), max);
};
const tween = (progress, start, end) => {
    const mul = sine(constrain(progress, 0, 1));
    const multiplier = end - start;
    const result = (mul * multiplier) + start;
    return result;
};
const drawImageWithBg = (ctx, image, x, y, w, h) => {
    ctx.fillStyle = "white";
    ctx.fillRect(x, y, w, h);
    ctx.drawImage(image, x, y, w, h);
};

class Command extends GifModifierCommand {
    // NOTE: Constructor will be called as a new instance of this class is made when "initialize" happens.
    // New instances are made by the "Editing video" thread to reduce performance impact when running videomodifier commands.
    constructor() {
        super();
        this.name = "winner";
        this.description = "Adds an image onto a Reddit Gold Slot Machine.";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };

        this.commandScript = path.join(__dirname, "./winner.js");
        this.requiresImage = true;
        this.supportsGif = true;

        this.frameSheetImage = null;
    }

    async initialize(Canvas) {
        this.frameSheetImage = await Canvas.loadImage('./assets/redditgold_sheet.jpg');
    }
    getGIFWidthHeight() {
        return [300, 310];
    }

    async drawGif(ctx, encoder, image, usingGif, width, height, args) {
        encoder.start();
        encoder.setRepeat(0); // 0 means "to repeat"
        encoder.setDelay(Math.round(1000 / 20)); // 20 FPS?

        let gifFrameCount = 0;
        if (usingGif) {
            gifFrameCount = image.reader.numFrames();
        }

        // NOTE: The sheet uses a 150x150 image for each frame, but we actually want to display these in 300x310. Its the original size of the GIF.
        for (let i = 0; i < frameSet.length; i++) {
            const frame = frameSet[i];
            const xMult = 150; // width of each frame
            const yMult = 150; // height of each frame
            ctx.drawImage(this.frameSheetImage, frame.x * xMult, frame.y * yMult, xMult, yMult, 0, 0, 300, 310);

            let drawingImage = image;
            if (usingGif) {
                const frame = image.frames[i % gifFrameCount];
                drawingImage = frame;
            }

            // frame 20-30: first one comes in
            if (i === 20) drawImageWithBg(ctx, drawingImage, 43, 50, 61, 28);
            if (i === 21) drawImageWithBg(ctx, drawingImage, 40, 51, 63, 40);
            if (i === 22) drawImageWithBg(ctx, drawingImage, 38, 54, 66, 49);
            if (i === 23) drawImageWithBg(ctx, drawingImage, 37, 60, 65, 56);
            if (i === 24) drawImageWithBg(ctx, drawingImage, 35, 63, 67, 62);
            if (i === 25) drawImageWithBg(ctx, drawingImage, 36, 70, 66, 64);
            if (i === 26) drawImageWithBg(ctx, drawingImage, 36, 75, 64, 66);
            if (i === 27) drawImageWithBg(ctx, drawingImage, 36, 78, 64, 68);
            if (i === 28) drawImageWithBg(ctx, drawingImage, 36, 82, 64, 68);
            if (i === 29) drawImageWithBg(ctx, drawingImage, 36, 83, 64, 68);
            if (i >= 30)  drawImageWithBg(ctx, drawingImage, 36, 84, 64, 68);

            // frame 34-52: second one comes in
            if (i === 34) drawImageWithBg(ctx, drawingImage, 120, 49, 58, 21);
            if (i === 35) drawImageWithBg(ctx, drawingImage, 119, 50, 61, 28);
            if (i === 36) drawImageWithBg(ctx, drawingImage, 119, 50, 60, 36);
            if (i === 37) drawImageWithBg(ctx, drawingImage, 119, 51, 62, 46);
            if (i === 38) drawImageWithBg(ctx, drawingImage, 117, 53, 64, 51);
            if (i === 39) drawImageWithBg(ctx, drawingImage, 118, 57, 64, 56);
            if (i === 40) drawImageWithBg(ctx, drawingImage, 117, 62, 65, 58);
            if (i === 41) drawImageWithBg(ctx, drawingImage, 117, 65, 64, 62);
            if (i === 42) drawImageWithBg(ctx, drawingImage, 117, 67, 65, 65);
            if (i === 43) drawImageWithBg(ctx, drawingImage, 117, 72, 65, 65);
            if (i === 44) drawImageWithBg(ctx, drawingImage, 117, 75, 65, 65);
            if (i === 45) drawImageWithBg(ctx, drawingImage, 117, 77, 65, 66);
            if (i === 46) drawImageWithBg(ctx, drawingImage, 117, 80, 65, 66);
            if (i === 47) drawImageWithBg(ctx, drawingImage, 117, 81, 65, 67);
            if (i === 48) drawImageWithBg(ctx, drawingImage, 117, 82, 65, 67);
            if (i === 49) drawImageWithBg(ctx, drawingImage, 117, 83, 65, 67);
            if (i === 50) drawImageWithBg(ctx, drawingImage, 117, 84, 65, 68);
            if (i === 51) drawImageWithBg(ctx, drawingImage, 117, 84, 65, 68);
            if (i >= 52)  drawImageWithBg(ctx, drawingImage, 117, 84, 65, 68);

            // frame 50-67: third one comes in
            if (i === 50) drawImageWithBg(ctx, drawingImage, 193, 49, 62, 19);
            if (i === 51) drawImageWithBg(ctx, drawingImage, 194, 50, 63, 25);
            if (i === 52) drawImageWithBg(ctx, drawingImage, 194, 50, 67, 31);
            if (i === 53) drawImageWithBg(ctx, drawingImage, 194, 50, 67, 39);
            if (i === 54) drawImageWithBg(ctx, drawingImage, 195, 52, 68, 44);
            if (i === 55) drawImageWithBg(ctx, drawingImage, 195, 54, 68, 47);
            if (i === 56) drawImageWithBg(ctx, drawingImage, 194, 56, 68, 53);
            if (i === 57) drawImageWithBg(ctx, drawingImage, 195, 59, 69, 55);
            if (i === 58) drawImageWithBg(ctx, drawingImage, 197, 60, 67, 61);
            if (i === 59) drawImageWithBg(ctx, drawingImage, 196, 65, 68, 62);
            if (i === 60) drawImageWithBg(ctx, drawingImage, 196, 68, 68, 64);
            if (i === 61) drawImageWithBg(ctx, drawingImage, 197, 71, 67, 64);
            if (i === 62) drawImageWithBg(ctx, drawingImage, 197, 73, 67, 66);
            if (i === 63) drawImageWithBg(ctx, drawingImage, 197, 75, 67, 68);
            if (i === 64) drawImageWithBg(ctx, drawingImage, 196, 78, 68, 68);
            if (i === 65) drawImageWithBg(ctx, drawingImage, 199, 79, 65, 68);
            if (i === 66) drawImageWithBg(ctx, drawingImage, 198, 82, 65, 67);
            if (i >= 67)  drawImageWithBg(ctx, drawingImage, 198, 84, 65, 68);

            // frame 84: gold starts to pour
            if (usingGif) {
                const frame = image.frames[0];
                drawingImage = frame;
            }
            if (i === 84) drawImageWithBg(ctx, drawingImage, 36, 227, 228, 4);
            if (i === 85) drawImageWithBg(ctx, drawingImage, 36, 227, 228, 11);
            if (i === 86) drawImageWithBg(ctx, drawingImage, 36, 227, 228, 17);
            if (i === 87) drawImageWithBg(ctx, drawingImage, 36, 227, 228, 22);
            if (i === 88) drawImageWithBg(ctx, drawingImage, 36, 227, 228, 31);
            if (i === 89) drawImageWithBg(ctx, drawingImage, 36, 227, 228, 35);
            if (i === 90) drawImageWithBg(ctx, drawingImage, 36, 227, 228, 37);

            // frame 90+: go big
            const sineLength = 17; // how many frames do we do the transition to filling the screen for
            if (i > 90) drawImageWithBg(ctx, drawingImage, tween((i - 90) / sineLength, 36, 0), tween((i - 90) / sineLength, 227, 0), tween((i - 90) / sineLength, 228, 300), tween((i - 90) / sineLength, 37, 310));

            // on gifs, we want to play the gif instead of waiting on the final image
            if (usingGif && i > 90 + sineLength) continue;
            encoder.addFrame(ctx);
        }

        if (usingGif) {
            for (let i = 0; i < image.frames.length; i++) {
                if (i > 191) break; // if the gif is 192+ frames, just dont render more than 192 frames

                const frame = image.frames[i];
                const frameInfo = image.reader.frameInfo(i);

                encoder.setDelay(frameInfo.delay * 10);
                drawImageWithBg(ctx, frame, 0, 0, 300, 310);

                encoder.addFrame(ctx);
            }
        }
        
        encoder.finish();
        return encoder.out.getData();
    }
}

module.exports = Command;