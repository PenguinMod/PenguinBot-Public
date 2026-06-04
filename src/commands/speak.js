const discord = require("discord.js");
const discordVoice = require('@discordjs/voice');
const fetch = require("node-fetch");
const OptionType = require('../util/optiontype');
const { Readable } = require('stream')
const PenguinChatVC = false;
const voiceChannelWithTTS = ['1169802355861114901', PenguinChatVC ? '1124133055012020296' : '_'];
const speechCooldowns = {};

class Command {
    constructor(client, state) {
        this.name = "speak";
        this.description = "Read out what you say or reply to someone to make it say what someone else says in the Scratch TTS voice.";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };
        this.example = [
            { text: `${state.prefix}speak abc`, image: "speak_example1.png" }
        ];

        this.client = client;
        this.connection = null;
        this.player = null;
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
        // are we in VC?
        const vc = message.member.voice.channel;
        if (!(vc && vc.id && voiceChannelWithTTS.includes(vc.id))) {
            message.reply(messageOptions);
            return;
        }
        // try to speak in VC

        if (message.author.id in speechCooldowns) {
            const cooldown = speechCooldowns[message.author.id];
            if (Date.now() - cooldown <= 4500) {
                speechCooldowns[message.author.id] += 3500;
                return message.reply('stop speaking');
            }
        }

        if (!this.connection) {
            this.connection = discordVoice.joinVoiceChannel({
                channelId: vc.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator
            });
            this.connection.on("stateChange", (_, newState) => {
                const disconnected = newState.status === discordVoice.VoiceConnectionStatus.Disconnected
                    || newState.status === discordVoice.VoiceConnectionStatus.Destroyed;
                if (disconnected) {
                    this.connection = null;
                    this.player = null;
                }
            });
        }
        const connection = this.connection;

        const readable = new Readable();
        readable._read = () => { }; // _read is required but you can noop it
        readable.push(buffer);
        readable.push(null);

        const resource = discordVoice.createAudioResource(readable, {
            inlineVolume: true
        });
        resource.volume.setVolume(2);
        if (!this.player) {
            this.player = discordVoice.createAudioPlayer();
            connection.subscribe(this.player);
        }
        this.player.play(resource);
        speechCooldowns[message.author.id] = Date.now();
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;