const Database = require('sync-json-database');
const PingResponseDB = new Database('./databases/ping-responses.json');
const PingResponseChannelsDB = new Database('./databases/ping-res-channels.json');
const isChannel = /^<#\d+>$/

class Command {
    constructor() {
        this.name = "pingresponse";
        this.description = "Set a message when users ping you.";
        this.attributes = {
            unlisted: true,
            exclusive: true,
            exclusiveInclusive: [
                '1038234739708006481',
                '1081053191602450552',
                '1161720252913168474',
                '1173376969900052492',
                '1160426569156808734',
            ],
        };
        this.alias = ['pingmessage', 'pingreply'];
    }
    
    invoke(message, args) {
        const userId = `${message.author.id}`;
        if (args[0] === 'channels:') {
            args.shift();
            let type = 'whitelist'
            if (!isChannel.exec(args[0])) type = args.shift()
            const channels = []
            for (const chunk of args.slice()) {
                if (!isChannel.exec(chunk)) break;
                args.shift()
                channels.push(chunk.slice(2, -1))
            }
            PingResponseChannelsDB.set(userId, {
                type,
                channels
            })
        }
        const reason = args.join(' ');
        if (!reason) {
            PingResponseDB.delete(userId);
            PingResponseChannelsDB.delete(userId);
            message.reply('Your ping message has been removed.');
            return;
        }

        let text = 'Your ping message has been added. The bot will respond with this whenever someone pings you.\nPing yourself to view your message. The bot will not respond for ping-replies.';
        if (reason.length > 256) {
            text += '\n**Note: Your response is over 256 characters. Your message will be cut off.**';
        }
        let newlineCount = 0;
        PingResponseDB.set(userId, reason
            .substring(0, 256)
            .replace(/\n/gmi, () => {
                newlineCount++;
                if (newlineCount > 3) return ' ';
                return '\n';
            }));
        message.reply(text);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
