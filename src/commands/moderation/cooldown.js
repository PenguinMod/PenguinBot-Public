const FormatTime = require('../../util/format-time.js');
const BaseCommand = require("../../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "cooldown";
        this.description = "Set a cooldown for the channel. Time is in seconds.";
        this.attributes = {
            unlisted: true,
            permission: 2,
        };

        this.alias = ['slowmode', 'timeout', 'timemode', 'coolout', 'coolmode'];
    }

    invoke(message, args) {
        if (!message.channel) return message.reply('You must be in a valid channel!');
        if (!('setRateLimitPerUser' in message.channel)) return message.reply('Cannot apply a slowmode here.');

        let seconds = 0;
        const inputTime = args.join(' ');
        if (!isNaN(Number(inputTime))) {
            seconds = Number(inputTime);
        } else {
            seconds = FormatTime.parseFormattedTime(args.join(' ')) / 1000;
        }
        if (isNaN(seconds)) return message.reply('Timestamp must be valid!');

        const maxSeconds = 21600;
        let completeMessage = '';
        if (seconds > maxSeconds) {
            seconds = maxSeconds;
            completeMessage = 'The time provided is too big!\n';
        }
        if (!seconds) {
            completeMessage = 'Cleared cooldown!';
        } else {
            completeMessage += `Set cooldown to ${FormatTime.formatTime(seconds * 1000)}`;
        }
        
        message.channel.setRateLimitPerUser(seconds, `Slowmode set by ${message.author.username}`);
        message.reply(completeMessage);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
