const Database = require('sync-json-database');
const SpoonfeederPingDB = new Database('./databases/spoonfeeder-pings.json');

const OptionType = require('../util/optiontype.js');
const BaseCommand = require("../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "spoonfeeder";
        this.description = "Pings Spoonfeeders. Can only be used in <#1090809014343974972>.";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToHelp: true
        };
    }

    async invoke(message) {
        if (message.channel.ownerId !== message.author.id)
            return message.reply("You can only ping spoonfeeder in posts you created.");
        if (SpoonfeederPingDB.has(`${message.channel.id}`))
            return message.reply("You have already pinged spoonfeeder. You may not ping them again in this post.");

        const helpChannel = this.client.channels.cache.get('1196865806420688936');
        await helpChannel.send(`<@&1114743708009627721> Help is needed in <#${message.channel.id}>!`);
        message.reply("Spoonfeeder has been pinged! 🔍");
        SpoonfeederPingDB.set(`${message.channel.id}`, true);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;