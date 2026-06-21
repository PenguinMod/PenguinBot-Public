const fs = require('fs');
const path = require('path');
const axios = require('axios')

const { MessageEmbed, MessageAttachment } = require("discord.js");
const OptionType = require('../../util/optiontype');
const configuration = require("../../config");

const memesFolder = path.join(__dirname, '../../../memes');

let idx = 0
const getRandomItem = numItems => {
    idx = (idx + 1) % numItems
    return (Math.round(Math.random() * numItems) + idx) % numItems
}

class Command {
    constructor() {
        this.name = "meme";
        this.description = "Get a random meme uploaded to the bot.";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };
    }

    extractAttachment(message) {
        let attachment = message.attachments.at(0)
        if (message.reference?.messageId) {
            return message.channel.messages.fetch(message.reference.messageId)
                .then(msg => msg.attachments.at(0))
        }
        return Promise.resolve(attachment)
    }
    
    async submit(message) {
        if (!message.member.roles.cache.has('1178994941343567952')) {
            message.reply('You don\'t have permission to do this.');
            return;
        }
        
        // Checks whether the message contains an attachment
        const attachment = await this.extractAttachment(message);
        if (!attachment) {
            message.reply("You must attach something to your message!");
            return;
        }
    
        const okMessage = await message.reply("Got the attachment, now downloading...");
        const url = attachment.url;

        const memeFile = path.join(memesFolder, `${attachment.name}`);
        
        // Create a write stream and log the progress
        const writeStream = fs.createWriteStream(`${memeFile}`);
    
          // Use Axios to download the image and pipe it to the write stream
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
        });
    
        response.data.pipe(writeStream);
        
        // Wait for the stream to finish writing the file
        await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });
    
        okMessage.edit('Saved the thing! <:good:1118293837773807657>');
    }

    count(message) {
        const memeFiles = fs.readdirSync(memesFolder)
            .filter(file => !file.endsWith('Thumbs.db'));
        const numItems = memeFiles.length
        message.reply(`There are ${numItems} memes. <:BLEH:1123465973312278629>`)
    }

    index(message) {
        const memeFiles = fs.readdirSync(memesFolder)
            .filter(file => !file.endsWith('Thumbs.db'));
        const list = new MessageAttachment(Buffer.from(JSON.stringify(memeFiles, null, 4)), 'memefiles.json')
        message.reply({files: [list]})
    }

    get(message, file) {
        const memeFiles = fs.readdirSync(memesFolder)
            .filter(file => !file.endsWith('Thumbs.db'));
        if (!memeFiles.includes(file)) {
            message.reply('no file found <:BLEH:1123465973312278629>')
            return;
        }
        const memePath = path.join(memesFolder, file);
        const meme = new MessageAttachment(memePath);
        message.reply({files: [meme]})
    }

    async remove(message, file) {
        const memeFiles = fs.readdirSync(memesFolder)
            .filter(file => !file.endsWith('Thumbs.db'));
        if (!memeFiles.includes(file)) {
            message.reply('no file found <:BLEH:1123465973312278629>')
            return;
        }
        const memePath = path.join(memesFolder, file);
        
        const meme = new MessageAttachment(memePath);
        await message.reply({content: 'file is being removed', files: [meme]});
        fs.rmSync(memePath);
        message.reply('file removed');
    }

    randomMeme(message, isDevChannel) {
        const memeFiles = fs.readdirSync(memesFolder)
            .filter(file => !file.endsWith('Thumbs.db'));
        const numItems = memeFiles.length
        const memeIdx = getRandomItem(numItems)
        const randomMeme = memeFiles[memeIdx];

        const memePath = path.join(memesFolder, randomMeme);
    
        const { name, ext } = path.parse(randomMeme);
        
        const meme = new MessageAttachment(memePath);
        
        const messageOptions = {
            files: [meme]
        };
        if (isDevChannel) {
            messageOptions.content = [
                `index: ${memeIdx}`,
                `name: ${name}`,
                `ext: ${ext}`,
                `all memes: ${numItems}`
            ].join('\n');
        }
        message.reply(messageOptions);
    }

    async invoke(message, args) {
        const isDevChannel = message.channel.id === configuration.channels.botTestingChannel;
        switch (args[0] ?? 'random') {
        case 'submit':
            await this.submit(message)
            break;
        case 'count':
            this.count(message)
            break;
        case 'random':
            this.randomMeme(message, isDevChannel)
        }

        if (!isDevChannel) return;
        switch (args[0]) {
        case 'list':
            this.index(message)
            break;
        case 'get':
            args.splice(0, 1)
            this.get(message, args.join(' '))
            break;
        case 'delete': 
            args.splice(0, 1)
            this.remove(message, args.join(' '))
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
