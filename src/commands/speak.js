const discord = require("discord.js");
const OptionType = require('../util/optiontype');

class Command {
    constructor(client) {
        this.name = "speak";
        this.description = "Read out what you say or reply to someone to make it say what someone else says in the Scratch TTS voice.";
        this.attributes = {
            permission: 0,
            lockedToCommands: true,
        };
        this.example = [
            { text: `{{prefix}}speak abc`, image: "speak_example1.png" }
        ];

        this.client = client;
    }

    filterBypass(text = '') {
        return text.toLowerCase()
            .replace('fuck', 'fuk')
            .replace('shit', 'shitt')
            .replace('dumbass', 'dumb as')
            .replace('ass', 'as')
            .replace('cum', 'come')
            .replace('dick', 'dic')
            .replace('sex', 'secks')
            .replace('damn', 'dam')
            .replace('bitch ass', 'bvitch as')
            .replace('bitch', 'bvitch')
            .replace('cock', 'cok')
            .replace('retard', 'restard')
            .replace('balls', 'ballls')
            .replace('butt', 'but');
    }
    extractContentFromReply(message) {
        if (!(message.reference && message.reference.messageId)) {
            throw new Error('Message is not a reply');
        }
        const reply = message.reference.messageId;
        return message.channel.messages.fetch(reply).then(repliedMessage => {
            if (!repliedMessage) {
                return '';
            }
            return repliedMessage.cleanContent || '';
        });
    }

    async invoke(message, args) {
        const url = `https://synthesis-service.scratch.mit.edu/synth?locale=en-US&gender=female&text=`;
        let speakingText = args.join(' ');
        if (!args[0]) {
            // this could be a reply
            if (!(message.reference && message.reference.messageId)) {
                return message.reply('Specify text to speak, or reply to a message to speak it\'s text.');
            }
            speakingText = await this.extractContentFromReply(message);
        }
        speakingText = String(speakingText);
        // bypass scratch's filter (for the funny)
        // also make sure we arent gonna get a bad request by the API by cutting it down
        let wasCutDown = false;
        if (speakingText.length > 128) {
            wasCutDown = true; // let the user know later
        }
        speakingText = this.filterBypass(speakingText).substring(0, 128);
        if (!speakingText) {
            return message.reply('Specify text to speak, or reply to a message with text to speak it.');
        }
        const response = await fetch(`${url}${encodeURIComponent(speakingText)}`);
        if (!response.ok) {
            console.log('---');
            console.error('TTS Error:', await response.text());
            console.log('^\n||\nv');
            console.error('TTS Text:', speakingText);
            console.log('---');
            message.reply('An error occurred. Please try again later.');
            return;
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const attachment = new discord.MessageAttachment(buffer, 'speech.mp3');
        const messageOptions = {
            files: [attachment]
        };
        if (wasCutDown) {
            messageOptions.content = '*The text had to be trimmed down for Scratch to handle it.*';
        }
        message.reply(messageOptions);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;