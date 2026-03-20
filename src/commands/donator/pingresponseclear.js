const Database = require('sync-json-database');
const PingResponseDB = new Database('./databases/ping-responses.json');
const PingResponseChannelsDB = new Database('./databases/ping-res-channels.json');

class Command {
    constructor() {
        this.name = "pingresponseclear";
        this.description = "Clears your ping response if you don't have boosts anymore.";
        this.attributes = {
            unlisted: false,
            exclusive: false
        };
    }
    
    invoke(message) {
        const userId = `${message.author.id}`;
        PingResponseDB.delete(userId);
        PingResponseChannelsDB.delete(userId);
        message.reply('Your ping message has been removed.');
        return;
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
