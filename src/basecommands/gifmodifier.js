const Discord = require('discord.js');
const OptionType = require('../util/optiontype');

const fs = require('fs');
const path = require('path');

const { uuid } = require('uuidv4');
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
    getGIFWidthHeight(message, args, util, imageUrl) {
        return [256, 256];
    }
    createSerializableData(message, args, util, imageUrl) {
        return {};
    }

    async invoke(message, args, util) {
        if (this.doRejectCommand(message, args, util)) return;

        let imageUrl = null;
        let usingGif = false;
        if (this.requiresImage) {
            const supportedTypes = ['png', 'jpeg', 'jpg'];
            if (this.supportsGif) {
                supportedTypes.push('gif');
            }

            const isDonator = util.isFromExclusive(message);
            if (message.attachments.size <= 0) {
                imageUrl = message.author.displayAvatarURL({ format: 'png', size: 256 });

                // Check if a user is mentioned in the args
                const mention = message.mentions.users.first();
                if (util.interactionsBlocked(mention)) {
                    if (mention.id !== message.author.id) return message.reply('The user you mentioned has interactions disabled.');
                }
                if (mention) {
                    imageUrl = mention.displayAvatarURL({ format: 'png', size: 256 });
                }
            } else {
                const attachment = message.attachments.first();
                const endingType = util.getAttachmentType(attachment);
                usingGif = endingType === "gif";
                
                if ((usingGif && !isDonator) || (!supportedTypes.includes(endingType))) {
                    if (this.supportsGif) {
                        return message.reply('Please use a valid image in `.png` or `.jpeg`/`.jpg` format.\nSupporters can use `.gif` images with this command.');
                    } else {
                        return message.reply('Please use a valid image in `.png` or `.jpeg`/`.jpg` format.');
                    }
                }

                if (!isDonator && attachment.size > 512000) {
                    return message.reply("Non-supporters or server boosters must use images below 512 KB.\nTry [resizing your image.](<https://ezgif.com/resize>)");
                }

                if (isDonator && !usingGif && attachment.size > 1e+6) {
                    return message.reply("Images must be below 1 MB.\nTry [resizing your image.](<https://ezgif.com/resize>)");
                }
                if (isDonator && usingGif && attachment.size > 2e+6) {
                    return message.reply("GIFs must be below 2 MB.\nTry [resizing your gif](<https://ezgif.com/resize>) or [optimizing it.](<https://ezgif.com/optimize>)");
                }

                imageUrl = attachment.url;
            }
        }

        const [width, height] = this.getGIFWidthHeight(message, args, util, imageUrl);
        const serializableData = this.createSerializableData(message, args, util, imageUrl);

        // start
        const loadingMessage = await message.reply('Creating GIF... <a:loading:1243400787980456006>');
        const requestId = uuid();
        const tempDir = path.join(__dirname, `../../cache/${requestId}/`);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        try {
            await runNewThread(
                this.workerScript,
                this.commandScript,
                {
                    tempDir,
                    imageUrl,
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