const fs = require('fs');
const path = require('path');

const uuid = require('uuid');

const Canvas = require('skia-canvas');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const isGif = require('../util/is-gif.js');
const BaseCommand = require("./basecommand.js");
const OptionType = require('../util/optiontype');
const botEmojis = require("../util/bot-emojis.js");
const runNewThread = require('../util/multi-thread.js');

const getVideoProperties = (video) => {
    return new Promise((resolve, reject) => {
        video.ffprobe((err, metadata) => {
            if (err) return reject(err);

            const stream = metadata.streams.find(s => s.codec_type === 'video');
            if (!stream) {
                return reject('No video stream found');
            }

            const [numerator, denominator] = stream.r_frame_rate.split('/');
            const frameRate = denominator ? Number(numerator) / Number(denominator) : Number(numerator);
            const frameCount = stream.nb_frames;
            const { width, height } = stream;

            resolve({ width, height, frameRate, frameCount });
        });
    });
}

class VideoModifierCommand extends BaseCommand {
    // This class shouldnt do anything really in constructor,
    // as a new instance will be made each time the "Editing video" thread is made.
    // New instances are made by the "Editing video" thread to reduce performance impact when running videomodifier commands.
    constructor() {
        super();

        /**
         * The input video to use as a backdrop. As of now this is required.
         * @type {string}
         */
        this.inputVideo = "../../assets/test.mp4";

        /**
         * Should be set to the current script's path like so:
         * ```js
         * this.commandScript = path.join(__dirname, "./my-command.js");
         * ```
         * @type {string}
         */
        this.commandScript = path.join(__dirname, "./videomodifier.js");
        /**
         * The worker script to use. Not recommended you change this.
         * @type {string}
         */
        this.workerScript = path.join(__dirname, "../resources/worker/videomodifier.worker.js");

        /**
         * Whether or not this command requires an input image from the user.
         * @type {boolean}
         */
        this.requiresImage = true;
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
     * Any custom serializable data to note when making the video.
     * @param {import("discord.js").Message} message 
     * @param {string[]} args 
     * @param {import("../util/utility-command.js")} util 
     * @param {Buffer} imageBuffer The input image from the user.
     * @param {ffmpeg.FfmpegCommand} video 
     * @param {number} width 
     * @param {number} height 
     * @param {number} frameRate 
     * @param {number} frameCount 
     * @returns {Promise<object>|object}
     */
    createSerializableData(message, args, util, imageBuffer, video, width, height, frameRate, frameCount) {
        return {};
    }

    async invoke(message, args, util) {
        if (this.doRejectCommand(message, args, util)) return;

        let imageBuffer = null;
        if (this.requiresImage) {
            const [inputImage] = await util.getInputImagesForCommand(1, this.supportsGif);
            if (!inputImage) return;
            imageBuffer = inputImage;
        }

        const loadingMessage = await message.reply({ content: `Editing video... ${botEmojis.loading}` });
        const requestId = uuid.v4();
        const tempDir = path.join(__dirname, `../../temp/${requestId}/`);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const imagePath = imageBuffer ? path.join(tempDir, `image.dat`) : null;
        if (imageBuffer) fs.writeFileSync(imagePath, imageBuffer);

        try {
            const videoPath = path.join(tempDir, 'output.mp4');
            const inputVideoPath = path.join(__dirname, this.inputVideo);

            const video = ffmpeg(inputVideoPath);
            const { width, height, frameRate, frameCount } = await getVideoProperties(video);
            const serializableData = await this.createSerializableData(message, args, util, imageBuffer, video, width, height, frameRate, frameCount);
            
            // This only works well because ffmpeg wants filenames for inputs & we cant just give it a bunch of buffers or something
            await runNewThread(
                this.workerScript,
                this.commandScript,
                {
                    tempDir,
                    imagePath,
                    frameCount,
                    frameRate,
                    width,
                    height,
                    args,
                    serializableData
                }
            );
            
            // Finalize the loading message
            loadingMessage.edit({ content: `Rendering video... ${botEmojis.loading}` });

            video
                .input(path.join(tempDir, 'frame%06d.png')) // Input frames
                .complexFilter([
                    {
                        filter: 'overlay',
                        options: {
                            x: 0,
                            y: 0,
                        },
                    }
                ])
                .inputFPS(frameRate)
                .output(videoPath)
                .on('end', () => {
                    const finalMessage = `Rendered video:`;
                    loadingMessage.edit({
                        content: finalMessage,
                        files: [videoPath],
                    }).finally(() => {
                        fs.rmSync(tempDir, { recursive: true, force: true });
                    });
                })
                .on('error', err => {
                    console.error(err);
                    loadingMessage.edit({ content: `An error occurred while rendering the final video. ❌\n${err}` });
                    fs.rmSync(tempDir, { recursive: true, force: true });
                })
                .run();
        } catch (error) {
            console.error(error);
            loadingMessage.edit({ content: `An error occurred while editing the video. ❌\n${error}` });
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    }
}

module.exports = VideoModifierCommand;
