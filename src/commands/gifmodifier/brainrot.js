const GifModifierCommand = require('../../basecommands/gifmodifier');
const path = require("path");

// frameSet should align with subwaysurfer_sheet.png
const frameSet = [
    { x: 0, y: 0, },
    { x: 1, y: 0, },
    { x: 2, y: 0, },
    { x: 3, y: 0, },
    { x: 4, y: 0, },
    { x: 5, y: 0, },
    { x: 6, y: 0, },
    { x: 7, y: 0, },
    { x: 8, y: 0, },
    { x: 9, y: 0, },
    { x: 0, y: 1, },
    { x: 1, y: 1, },
    { x: 2, y: 1, },
    { x: 3, y: 1, },
    { x: 4, y: 1, },
    { x: 5, y: 1, },
    { x: 6, y: 1, },
    { x: 7, y: 1, },
    { x: 8, y: 1, },
    { x: 9, y: 1, },
    { x: 0, y: 2, },
    { x: 1, y: 2, },
    { x: 2, y: 2, },
    { x: 3, y: 2, },
    { x: 4, y: 2, },
    { x: 5, y: 2, },
    { x: 6, y: 2, },
    { x: 7, y: 2, },
    { x: 8, y: 2, },
    { x: 9, y: 2, },
    { x: 0, y: 3, },
    { x: 1, y: 3, },
    { x: 2, y: 3, },
    { x: 3, y: 3, },
    { x: 4, y: 3, },
    { x: 5, y: 3, },
    { x: 6, y: 3, },
    { x: 7, y: 3, },
    { x: 8, y: 3, },
    { x: 9, y: 3, },
    { x: 0, y: 4, },
    { x: 1, y: 4, },
    { x: 2, y: 4, },
    { x: 3, y: 4, },
    { x: 4, y: 4, },
];

class Command extends GifModifierCommand {
    // NOTE: Constructor will be called as a new instance of this class is made when "initialize" happens.
    // New instances are made by the "Editing video" thread to reduce performance impact when running videomodifier commands.
    constructor() {
        super();
        this.name = "brainrot";
        this.description = "Adds a subway surfers gif to the side of an image, or yourself.";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };

        this.commandScript = path.join(__dirname, "./brainrot.js");
        this.requiresImage = true;

        this.frameSheetImage = null;
    }

    async initialize(Canvas) {
        this.frameSheetImage = await Canvas.loadImage('./assets/subwaysurfer_sheet.png');
    }
    getGIFWidthHeight() {
        return [256, 256];
    }

    async drawGif(ctx, encoder, image, usingGif, width, height, args) {
        encoder.start();
        encoder.setRepeat(0); // 0 means "to repeat"
        encoder.setDelay(Math.round(1000 / 24)); // 24 FPS?
        encoder.setTransparent(); // for transparent avatars/images

        ctx.drawImage(image, 0, 0, 128, 256);

        for (const frame of frameSet) {
            const xMult = 64; // width of each frame
            const yMult = 128; // height of each frame
            ctx.drawImage(this.frameSheetImage, frame.x * xMult, frame.y * yMult, xMult, yMult, 128, 0, 128, 256);
            encoder.addFrame(ctx);
        }
        
        encoder.finish();

        return encoder.out.getData();
    }
}

module.exports = Command;