const fs = require("fs/promises");
const path = require("path");

const Canvas = require('skia-canvas');
const sharp = require("sharp");

const makePng = require("../../util/make-png.js");

// DISCLOSURE: ai like do you Really expect me to make kernel matrices myself man im not that smart
const motionBlur = (intensity) => {
    // 1. Force the matrix to use an odd size for proper alignment
    let size = Math.max(2, Math.round(intensity));
    if (size % 2 === 0) size += 1;

    // 2. Initialize a complete 2D flat array initialized to zero
    const totalElements = size * size;
    const flatMatrix = new Array(totalElements).fill(0);

    // 3. Populate only the middle vertical column with 1s
    const middleColumnIndex = Math.floor(size / 2);

    for (let r = 0; r < size; r++) {
        // Calculate the flat array index for the center of each row
        const targetIndex = (r * size) + middleColumnIndex;
        flatMatrix[targetIndex] = 1;
    }

    // 4. Return the valid square structure to the engine
    return {
        width: size,
        height: size,
        kernel: flatMatrix,
        scale: size, // Divides by the active elements to normalize colors
        offset: 0
    };
};

const GifModifierCommand = require('../../classes/gifmodifier');
class Command extends GifModifierCommand {
    // NOTE: Constructor will be called as a new instance of this class is made when "initialize" happens.
    // New instances are made by the "Editing video" thread to reduce performance impact when running videomodifier commands.
    constructor() {
        super();
        this.name = "tuff";
        this.description = "Creates a dramatic grayscale \"drop\" effect on the image.";
        this.attributes = {
            permission: 0,
            lockedToCommands: true,
        };

        this.commandScript = path.join(__dirname, "./tuff.js");
        this.requiresImage = true;
        this.supportsGif = true;

        /** @type {Canvas.Canvas} */
        this.canvas = null;
        this.vignetteImage = null;
    }
    async initialize(_, canvas) {
        this.canvas = canvas;
        this.vignetteImage = await Canvas.loadImage('./assets/vignette.png');
    }

    async getGIFWidthHeight(_, __, ___, imageBuffer) {
        const pngBuffer = await makePng(imageBuffer);
        const image = await Canvas.loadImage(pngBuffer);
        const maxSize = 400;
        
        // rescale to amxsize
        let width = image.width;
        let height = image.height;
        const scale = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        return [width, height];
    }

    async drawGif(ctx, encoder, image, usingGif, width, height, args) {
        encoder.start();
        encoder.setRepeat(0); // 0 means "to repeat"

        let lastGifFrame = null;
        if (usingGif) {
            // let the gif play out
            for (let i = 0; i < image.frames.length; i++) {
                if (i > 191) break; // if the gif is 192+ frames, just dont render more than 192 frames

                const frame = image.frames[i];
                const frameInfo = image.reader.frameInfo(i);
                lastGifFrame = frame;
                encoder.setDelay(frameInfo.delay * 10);

                // draw the frame
                ctx.fillStyle = "black";
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(frame, 0, 0, width, height);
                encoder.addFrame(ctx);
            }
        }

        // draw the last frame so we can use it for the dramatic end
        const finalFrame = lastGifFrame ? lastGifFrame : image;
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(finalFrame, 0, 0, width, height);

        // do our dramatic end
        // make motion blur frames for 16 blurs (which we draw in grayscale)
        const blurImages = [];
        const finalFrameBuffer = await this.canvas.toBuffer("image/png");
        for (let i = 32; i > 2; i--) {
            const kernel = motionBlur(i);
            const brightness = 1 + ((i / 32) / 4);
            const imageBuffer = await sharp(finalFrameBuffer)
                .convolve(kernel)
                .grayscale()
                .modulate({ brightness: brightness })
                .linear(brightness, 0)
                .toBuffer();
            const canvasImage = await Canvas.loadImage(imageBuffer);
            blurImages.push(canvasImage);
        }

        // just a version in gray with no blur
        const grayImageBuffer = await sharp(finalFrameBuffer)
            .grayscale()
            .toBuffer();
        const grayCanvasImage = await Canvas.loadImage(grayImageBuffer);

        // draw these blurs with effects
        // offset the vignette so it's not so obvious. pos controls xy, size is pos but * 2 so it centers
        const vignetteBufferPos = 1.15;
        const vignetteBufferSize = 1.3;
        encoder.setDelay(Math.round(1000 / 30)); // 30 FPS?
        for (let i = 0; i < blurImages.length; i++) {
            const image = blurImages[i];
            const revI = (blurImages.length - 1) - i;
            const powI = ((revI / 2) ** 3) / 8;
            const flipper = Math.sin(powI * Math.PI / 180);
            ctx.drawImage(image, -powI, (-powI) + flipper * powI, width + (powI * 2), height + (powI * 2));
            ctx.drawImage(this.vignetteImage, -((width * vignetteBufferPos) - width), -((height * vignetteBufferPos) - height), width * vignetteBufferSize, height * vignetteBufferSize);
            encoder.addFrame(ctx);
        }

        // second of delay for the last frame
        ctx.drawImage(grayCanvasImage, 0, 0, width, height);
        ctx.drawImage(this.vignetteImage, -((width * vignetteBufferPos) - width), -((height * vignetteBufferPos) - height), width * vignetteBufferSize, height * vignetteBufferSize);
        encoder.setDelay(1000);
        encoder.addFrame(ctx);

        encoder.finish();
        return encoder.out.getData();
    }
}

module.exports = Command;