const Database = require('sync-json-database');
const SpoonfeederPingDB = new Database('./databases/spoonfeeder-pings.json');
const OptionType = require('../util/optiontype');

class Command {
    constructor() {
        this.name = "spoonfeeder";
        this.description = "Pings Spoonfeeders. Can only be used in <#1090809014343974972>.";
        this.attributes = {
            unlisted: false,
            admin: false,
            lockedToHelp: true
        };
    }

    async invoke(message, __, _, client) {
        if (SpoonfeederPingDB.has(`${message.channel.id}`)) {
            message.reply("You have already pinged spoonfeeder. You may not ping them again in this post.")
            return;
        }

        const help = client.channels.cache.get('1196865806420688936');
        await help.send(`<@&1114743708009627721> Help is needed in <#${message.channel.id}>!`);
        message.reply("Spoonfeeder has been pinged! <:good:1118293837773807657>")
        SpoonfeederPingDB.set(`${message.channel.id}`, true);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;