
const discord = require('discord.js');
const OptionType = require('../util/optiontype');

const fs = require('fs');
const path = require('path');

const uuid = require('uuid');
const isGif = require('../util/is-gif');
const runNewThread = require('../util/multi-thread');

const Canvas = require('canvas');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const getVideoProperties = (video) => {
    return new Promise((resolve, reject) => {
        video.ffprobe((err, metadata) => {
            if (err) return reject(err);

            const stream = metadata.streams.find(s => s.codec_type === 'video');
            if (!stream) {
                return reject('No video stream found');
            }

            // TODO: surely this is unsafe and there's a better way? did i even do this myself or did i use ai?
            const frameRate = eval(stream.r_frame_rate); // Convert "30/1" to 30, "25/1" to 25, etc.
            const frameCount = stream.nb_frames;
            const { width, height } = stream;

            resolve({ width, height, frameRate, frameCount });
        });
    });
}

class Command {
    // This class shouldnt do anything really in constructor,
    // as a new instance will be made each time the "Editing video" thread is made.
    // New instances are made by the "Editing video" thread to reduce performance impact when running videomodifier commands.
    constructor() {
        this.inputVideo = "../../assets/test.mp4";
        this.commandScript = path.join(__dirname, "./videomodifier.js");
        this.workerScript = path.join(__dirname, "./videomodifier.worker.js"); // Not recommended you change this.
        this.requiresImage = true;
    }

    doRejectCommand(message, args, util) {
        return false;
    }
    createSerializableData(message, args, util, imageBuffer, video, width, height, frameRate, frameCount) {
        return {};
    }

    async invoke(message, args, util) {
        if (this.doRejectCommand(message, args, util)) return;

        let imageBuffer = null;
        if (this.requiresImage) {
            const [inputImage] = await util.getInputImagesForCommand(message, 1, this.supportsGif);
            if (!inputImage) return;
            imageBuffer = inputImage;
        }

        const loadingMessage = await message.reply({ content: "Editing video... <a:loading:1243400787980456006>" });
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
            const serializableData = this.createSerializableData(message, args, util, imageBuffer, video, width, height, frameRate, frameCount);
            
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
            loadingMessage.edit({ content: "Rendering video... <a:loading:1243400787980456006>" });

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
                    loadingMessage.edit({ content: `An error occurred while rendering the final video. <:no:1164832595478069299>\n${err}` });
                    fs.rmSync(tempDir, { recursive: true, force: true });
                })
                .run();
        } catch (error) {
            console.error(error);
            loadingMessage.edit({ content: `An error occurred while editing the video. <:no:1164832595478069299>\n${error}` });
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    }
}

module.exports = Command;