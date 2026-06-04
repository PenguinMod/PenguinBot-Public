/**
 * @fileoverview PenguinBot implementation of https://github.com/aDu/pet-pet-gif
 */
/** */
const GifModifierCommand = require('../../basecommands/gifmodifier');
const path = require("path");

// frameSet should align with petpet-sheet.png
const frameSet = [
    { x: 0, y: 0, },
    { x: 1, y: 0, },
    { x: 2, y: 0, },
    { x: 3, y: 0, },
    { x: 0, y: 1, },
    { x: 1, y: 1, },
    { x: 2, y: 1, },
    { x: 3, y: 1, },
    { x: 0, y: 2, },
    { x: 1, y: 2, },
];

class Command extends GifModifierCommand {
    // NOTE: Constructor will be called as a new instance of this class is made when "initialize" happens.
    // New instances are made by the "Editing video" thread to reduce performance impact when running videomodifier commands.
    constructor() {
        super();
        this.name = "pet";
        this.description = "make a pet pet gif";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };

        this.alias = ["petpet", "petgif"];

        this.commandScript = path.join(__dirname, "./pet.js");
        this.requiresImage = true;

        this.frameSheetImage = null;
    }

    async initialize(Canvas) {
        this.frameSheetImage = await Canvas.loadImage('./assets/petpet-sheet.png');
    }
    getGIFWidthHeight() {
        return [112, 112];
    }

    async drawGif(ctx, encoder, image, usingGif, width, height, args) {
        encoder.start();
        encoder.setRepeat(0); // 0 means "to repeat"
        encoder.setDelay(20);
        encoder.setTransparent(); // for transparent avatars/images

        for (let i = 0; i < frameSet.length; i++) {
            const frame = frameSet[i];
            ctx.clearRect(0, 0, 112, 112);

            // https://github.com/aDu/pet-pet-gif
            const j = i < 10 / 2 ? i : 10 - i;

            const width = 0.8 + j * 0.02;
            const height = 0.8 - j * 0.05;
            const offsetX = (1 - width) * 0.5 + 0.1;
            const offsetY = (1 - height) - 0.08;

            ctx.drawImage(image, 112 * offsetX, 112 * offsetY, 112 * width, 112 * height)

            const xMult = 112; // width of each frame
            const yMult = 112; // height of each frame
            ctx.drawImage(this.frameSheetImage, frame.x * xMult, frame.y * yMult, xMult, yMult, 0, 0, 112, 112);

            encoder.addFrame(ctx);
        }
        
        encoder.finish();

        return encoder.out.getData();
    }
}

module.exports = Command;