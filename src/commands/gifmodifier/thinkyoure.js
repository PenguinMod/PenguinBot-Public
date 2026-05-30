const GifModifierCommand = require('../../basecommands/gifmodifier');
const path = require("path");

// frameSet should align with you-are-nuts-sheet.png
const frameSet = [
    { x: 0, y: 0, },
    { x: 1, y: 0, },
    { x: 2, y: 0, },
    { x: 3, y: 0, },
    { x: 4, y: 0, },
    { x: 5, y: 0, },
    { x: 0, y: 1, },
    { x: 1, y: 1, },
    { x: 2, y: 1, },
    { x: 3, y: 1, },
    { x: 4, y: 1, },
    { x: 5, y: 1, },
    { x: 0, y: 2, },
    { x: 1, y: 2, },
    { x: 2, y: 2, },
    { x: 3, y: 2, },
    { x: 4, y: 2, },
    { x: 5, y: 2, },
    { x: 0, y: 3, },
    { x: 1, y: 3, },
    { x: 2, y: 3, },
    { x: 3, y: 3, },
    { x: 4, y: 3, },
    { x: 5, y: 3, },
    { x: 0, y: 4, },
    { x: 1, y: 4, },
    { x: 2, y: 4, },
    { x: 3, y: 4, },
    { x: 4, y: 4, },
    { x: 5, y: 4, },
    { x: 0, y: 5, },
    { x: 1, y: 5, },
    { x: 0, y: 0, },
    { x: 0, y: 0, },
];

class Command extends GifModifierCommand {
    // NOTE: Constructor will be called as a new instance of this class is made when "initialize" happens.
    // New instances are made by the "Editing video" thread to reduce performance impact when running videomodifier commands.
    constructor() {
        super();
        this.name = "thinkyoure";
        this.description = "Adds the text and image into the \"I think you're nuts.\" scene in the SMMV.";
        this.attributes = {
            unlisted: false,
            admin: false,
            lockedToCommands: true,
        };

        this.alias = ["thinkyour", "ithinkyour", "ithinkyoure"];

        this.commandScript = path.join(__dirname, "./thinkyoure.js");
        this.requiresImage = true;
        this.supportsGif = true;

        this.frameSheetImage = null;
    }

    async initialize(Canvas) {
        this.frameSheetImage = await Canvas.loadImage('./assets/you-are-nuts-sheet.png');
    }
    getGIFWidthHeight() {
        return [256, 256];
    }
    createSerializableData(message, args) {
        let memeText = message.author.username;
        const argumentText = String(args.join(' ')).trim();
        const hasArgumentText = argumentText.length > 0;
        if (hasArgumentText) {
            memeText = argumentText;
        }

        // Check if a user is mentioned in the args
        const mention = message.mentions.users.first();
        if (mention && (!hasArgumentText || argumentText === `<@${mention.id}>`)) {
            memeText = mention.username;
        }

        return { memeText };
    }

    strokeText(ctx, text, x, y) {
        const orgFill = ctx.fillStyle;
        ctx.fillStyle = ctx.strokeStyle;

        ctx.fillText(text, x - 2, y - 2);
        ctx.fillText(text, x + 2, y - 2);
        ctx.fillText(text, x - 2, y + 2);
        ctx.fillText(text, x + 2, y + 2);

        ctx.fillStyle = orgFill;
    }

    async drawGif(ctx, encoder, image, usingGif, width, height, args, serializableData) {
        const memeText = serializableData.memeText;

        // gif stuff
        encoder.start();
        encoder.setRepeat(0); // 0 means "to repeat"
        encoder.setDelay(Math.round(1000 / 24)); // 24 FPS?

        ctx.textBaseline = "top";
        ctx.textDrawingMode = "glyph";
        ctx.strokeStyle = "#223";

        for (let idx = 0; idx < frameSet.length; idx++) {
            const frame = frameSet[idx];
            const xMult = 442 / 2; // width of each frame
            const yMult = 338 / 2; // height of each frame
            ctx.drawImage(this.frameSheetImage, frame.x * xMult, frame.y * yMult, xMult, yMult, 0, 0, 256, 256);

            ctx.fillStyle = "white";
            ctx.textBaseline = "top";
            ctx.font = "bold 42px Arial";
            if (idx > 2 && idx < 9) {
                this.strokeText(ctx, "I", 15, 9);
                ctx.fillText("I", 15, 9);
            }
            if (idx >= 9) {
                this.strokeText(ctx, "I Think..", 15, 9);
                ctx.fillText("I Think..", 15, 9);
            }

            if (idx > 14) {
                this.strokeText(ctx, "You're", 3, 197);
                ctx.fillText("You're", 3, 197);
            }
            if (idx >= 23) {
                ctx.fillStyle = "#111";
                ctx.textBaseline = "middle";
                ctx.font = "32px \"Times New Roman\"";
                ctx.fillRect(118, 175, 134, 77);

                ctx.fillStyle = "yellow";
                ctx.fillText(memeText, 118, 175 + 38, 134);
            }

            encoder.addFrame(ctx);
        }
        
        ctx.fillStyle = "white";
        for (let i = 0; i < 11; i++) {
            const yPos = Math.round((i / 10) * 256);
            ctx.fillRect(0, -256 + yPos, 256, 256);

            if (!usingGif) {
                ctx.drawImage(image, 0, -256 + yPos, 256, 256);
            } else {
                // get the first frame
                const firstFrame = image.frames[0];
                ctx.drawImage(firstFrame, 0, -256 + yPos, 256, 256);
            }

            encoder.addFrame(ctx);
        }

        // just repeat last frame a few times
        let repeatCount = 12;
        ctx.fillRect(0, 0, 256, 256);

        if (!usingGif) {
            ctx.drawImage(image, 0, 0, 256, 256);
        } else {
            const numFrames = image.reader.numFrames();
            repeatCount = 12 - numFrames;

            for (let i = 0; i < image.frames.length; i++) {
                if (i > 191) break; // if the gif is 192+ frames, just dont render more than 192 frames

                const frame = image.frames[i];
                const frameInfo = image.reader.frameInfo(i);
                
                encoder.setDelay(frameInfo.delay * 10);
                ctx.fillRect(0, 0, 256, 256);
                ctx.drawImage(frame, 0, 0, 256, 256);

                encoder.addFrame(ctx);
            }
        }
        
        if (repeatCount >= 1) {
            for (let i = 0; i < repeatCount; i++) {
                encoder.addFrame(ctx);
            }
        }
        
        encoder.finish();

        return encoder.out.getData();
    }
}

module.exports = Command;