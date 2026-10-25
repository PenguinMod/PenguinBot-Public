const fs = require('fs');
const path = require('path');

const uuid = require('uuid');

const isGif = require('../util/is-gif.js');
const BaseCommand = require("./basecommand.js");
const OptionType = require('../util/optiontype');
const botEmojis = require("../util/bot-emojis.js");
const runNewThread = require('../util/multi-thread.js');

class GifModifierCommand extends BaseCommand {
    // This class shouldnt do anything really in constructor,
    // as a new instance will be made each time the "Editing GIF" thread is made.
    // New instances are made by the "Editing GIF" thread to reduce performance impact when running gifmodifier commands.
    constructor() {
        super();

        /**
         * Should be set to the current script's path like so:
         * ```js
         * this.commandScript = path.join(__dirname, "./my-command.js");
         * ```
         * @type {string}
         */
        this.commandScript = path.join(__dirname, "./gifmodifier.js");
        /**
         * The worker script to use. Not recommended you change this.
         * @type {string}
         */
        this.workerScript = path.join(__dirname, "../resources/worker/gifmodifier.worker.js");

        /**
         * Whether or not this command requires an input image from the user.
         * @type {boolean}
         */
        this.requiresImage = true;
        /**
         * Whether or not this command supports GIF input images from the user.
         * @type {boolean}
         */
        this.supportsGif = false;
    }

    /**
     * An early hook to reject the command before it begins.
     * Returns true to reject the command.
     * @param {import("discord.js").Message} message 
     * @param {string[]} args 
     * @param {import("../util/utility-command.js")} util 
     * @returns {boolean}
     */
    doRejectCommand(message, args, util) {
        return false;
    }
    /**
     * Determine the width/height of the output GIF.
     * @param {import("discord.js").Message} message 
     * @param {string[]} args 
     * @param {import("../util/utility-command.js")} util 
     * @param {Buffer} imageBuffer The input image from the user.
     * @returns {Promise<[number, number]>|[number, number]}
     */
    getGIFWidthHeight(message, args, util, imageBuffer) {
        return [256, 256];
    }
    /**
     * Any custom serializable data to note when making the GIF.
     * @param {import("discord.js").Message} message 
     * @param {string[]} args 
     * @param {import("../util/utility-command.js")} util 
     * @param {Buffer} imageBuffer The input image from the user.
     * @returns {Promise<object>|object}
     */
    createSerializableData(message, args, util, imageBuffer) {
        return {};
    }

    async invoke(message, args, util) {
        if (this.doRejectCommand(message, args, util)) return;

        let imageBuffer = null;
        let usingGif = false;
        if (this.requiresImage) {
            const [inputImage] = await util.getInputImagesForCommand(1, this.supportsGif);
            if (!inputImage) return;
            imageBuffer = inputImage;
            usingGif = isGif(imageBuffer);
        }

        const [width, height] = await this.getGIFWidthHeight(message, args, util, imageBuffer);
        const serializableData = await this.createSerializableData(message, args, util, imageBuffer);

        // start
        const loadingMessage = await message.reply(`Creating GIF... ${botEmojis.loading}`);
        const requestId = uuid.v4();
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
            loadingMessage.edit({ content: `An error occurred while editing the GIF. ❌\n${error}` });
        } finally {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    }
}

module.exports = GifModifierCommand;
