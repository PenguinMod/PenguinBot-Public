const VideoModifierCommand = require('../../classes/videomodifier');
const path = require("path");

class Command extends VideoModifierCommand {
    constructor() {
        super();
        this.name = "testvideo";
        this.description = "Test video command";
        this.attributes = {
            unlisted: true,
            exclusive: true,
        };
        
        this.inputVideo = "../../assets/test.mp4";
        this.commandScript = path.join(__dirname, "./testvideo.js");
        this.requiresImage = true;
    }

    drawFrame(ctx, image, frameIndex) {
        ctx.drawImage(image, frameIndex, 0, 128, 128);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;