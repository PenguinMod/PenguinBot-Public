const Discord = require('discord.js');
const OptionType = require('../util/optiontype');

const fs = require('fs');
const path = require('path');

const { uuid } = require('uuidv4');
const isGif = require('../util/is-gif');
const runNewThread = require('../util/multi-thread');

class Command {
    // This class shouldnt do anything really in constructor,
    // as a new instance will be made each time the "Editing GIF" thread is made.
    // New instances are made by the "Editing GIF" thread to reduce performance impact when running gifmodifier commands.
    constructor() {
        this.commandScript = path.join(__dirname, "./gifmodifier.js");
        this.workerScript = path.join(__dirname, "./gifmodifier.worker.js"); // Not recommended you change this.
        this.requiresImage = true;
        this.supportsGif = false;
    }

    doRejectCommand(message, args, util) {
        return false;
    }
    getGIFWidthHeight(message, args, util, imageBuffer) {
        return [256, 256];
    }
    createSerializableData(message, args, util, imageBuffer) {
        return {};
    }

    async invoke(message, args, util) {
        if (this.doRejectCommand(message, args, util)) return;

        let imageBuffer = null;
        let usingGif = false;
        if (this.requiresImage) {
            const [inputImage] = await util.getInputImagesForCommand(message, 1, this.supportsGif);
            if (!inputImage) return;
            imageBuffer = inputImage;
            usingGif = isGif(imageBuffer);
        }

        const [width, height] = this.getGIFWidthHeight(message, args, util, imageBuffer);
        const serializableData = this.createSerializableData(message, args, util, imageBuffer);

        // start
        const loadingMessage = await message.reply('Creating GIF... <a:loading:1243400787980456006>');
        const requestId = uuid();
        const tempDir = path.join(__dirname, `../../temp/${requestId}/`);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const imagePath = imageBuffer ? path.join(tempDir, `image.dat`) : null;
        if (imageBuffer) fs.writeFileSync(imagePath, imageBuffer);

        try {
            await runNewThread(
                this.workerScript,
                this.commandScript,
                {
                    tempDir,
                    imagePath,
                    usingGif,
                    width,
                    height,
                    args,
                    serializableData
                }
            );

            const gifPath = path.join(tempDir, 'edited.gif');

            // Send the image as a reply
            await loadingMessage.edit({
                content: `Rendered GIF for <@${message.author.id}>:`,
                files: [gifPath]
            });
        } catch (error) {
            console.error(error);
            loadingMessage.edit({ content: `An error occurred while editing the GIF. <:no:1164832595478069299>\n${error}` });
        } finally {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    }
}

module.exports = Command;