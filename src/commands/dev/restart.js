const BotState = require("../../util/bot-state.js");
const HostUtility = require("../../util/utility-host.js");
const BaseCommand = require("../../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "restart";
        this.description = "Restart the bot";
        this.attributes = {
            unlisted: true,
            permission: 1,
        };
    }

    async invoke(message) {
        const shouldntRestart = BotState.request('preventRuntimeChanges');
        if (shouldntRestart)
            return message.reply('Variable `PREVENT_UPDATES` is set to true on this host.');

        BotState.persist("restartMessage", message.id);
        BotState.persist("restartChannel", message.channel.id);
        await message.reply('Restarting bot...');
        await HostUtility.restart();
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;