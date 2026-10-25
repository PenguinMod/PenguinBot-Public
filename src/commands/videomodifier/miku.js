const VideoModifierCommand = require('../../classes/videomodifier');
const path = require("path");

const interpolate = (time, a, b) => {
    // don't restrict range of time as some easing functions are expected to go outside the range
    const multiplier = b - a;
    const result = time * multiplier + a;
    return result;
};
const cubic = (x, dir) => {
    switch (dir) {
        case "in": {
            return x * x * x;
        }
        case "out": {
            return 1 - Math.pow(1 - x, 3);
        }
        case "inout": {
            return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
        }
        default:
            return 0;
    }
};
const back = (x, dir) => {
    switch (dir) {
        case "in": {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return c3 * x * x * x - c1 * x * x;
        }
        case "out": {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
        }
        case "inout": {
            const c1 = 1.70158;
            const c2 = c1 * 1.525;
            return x < 0.5
                ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
                : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
        }
        default:
            return 0;
    }
};

class Command extends VideoModifierCommand {
    // NOTE: Constructor will be called as a new instance of this class is made when "initialize" happens.
    // New instances are made by the "Editing video" thread to reduce performance impact when running videomodifier commands.
    constructor() {
        super();
        this.name = "miku";
        this.description = "Miku Miku Beam, but you can use your own image.";
        this.attributes = {
            unlisted: false,
            exclusive: true,
            lockedToCommands: true,
        };

        this.inputVideo = "../../assets/miku.mp4";
        this.commandScript = path.join(__dirname, "./miku.js");
        this.requiresImage = true;

        this.speedLinesImage = null;
    }

    async initialize(Canvas) {
        this.speedLinesImage = await Canvas.loadImage("./assets/speedlines.png");
    }
    drawFrame(ctx, image, frameIndex, _, __, videoWidth, videoHeight) {
        ctx.clearRect(0, 0, videoWidth, videoHeight);

        let x = videoWidth / 2;
        let y = 0
        let visible = false;
        let size = 100;

        // 91 to 109, bounce the image from bottom to top
        if (frameIndex >= 91) {
            // y needs to start at vidoe height and back out ease into center
            const backTween = back((frameIndex - 91) / (109 - 91), "out");
            y = interpolate(backTween, videoHeight, videoHeight / 2);
            size = 300;
            visible = true;
        }
        if (frameIndex >= 109) {
            y = videoHeight / 2
        }
        // 113 to 123, zoom out a bit before the beam
        if (frameIndex >= 113) {
            const cubicTween = cubic((frameIndex - 113) / (123 - 113), "inout");
            y = interpolate(cubicTween, videoHeight / 2, videoHeight / 2.05);
            size = interpolate(cubicTween, 300, 220);
        }
        // 123 to 195, big beam zoom in part
        if (frameIndex >= 123) {
            y = interpolate((frameIndex - 123) / (196 - 123), videoHeight / 2.05, videoHeight / 2);
            size = interpolate((frameIndex - 123) / (196 - 123), 220, 320);
        }
        if (frameIndex >= 196) {
            visible = false;
        }

        if (visible) {
            const aspectRatio = image.width / image.height;
        
            let drawWidth, drawHeight;
            if (aspectRatio > 1) {
                // image is wider than tall
                drawWidth = size;
                drawHeight = size / aspectRatio;
            } else {
                // image is taller than wide
                drawWidth = size * aspectRatio;
                drawHeight = size;
            }
        
            // we need to center the image
            ctx.drawImage(image, x - (drawWidth / 2), y - (drawHeight / 2), drawWidth, drawHeight);
        }
        // draw speed lines
        if (frameIndex >= 123 && frameIndex < 196) {
            const xMult = 500; // width of each frame
            const yMult = 281; // height of each frame
            let x = frameIndex % 5;
            let y = frameIndex % 3;
            ctx.drawImage(this.speedLinesImage, x * xMult, y * yMult, xMult, yMult, 0, 0, videoWidth, videoHeight);
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;