const childProcess = require("child_process");

const configuration = require("../../config.js");

const env = require("../../util/env-util.js");
const BotState = require("../../util/bot-state.js");
const HostUtility = require("../../util/utility-host.js");
const BaseCommand = require("../../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "pull";
        this.description = "Pull from branch";
        this.attributes = {
            unlisted: true,
            permission: 3,
        };
    }

    async invoke(message, args) {
        if (!configuration.permissions.pull.includes(message.author.id))
            return message.reply("You don't have permission to do this.");

        if (BotState.request('preventRuntimeChanges')) return message.reply('Variable `PREVENT_UPDATES` is set to true on this host.');
        if (env.getBool("DISABLE_GIT")) return message.reply('Variable `DISABLE_GIT` is set to true on this host.');

        const repliedMessage = await message.reply('Pulling changes from the GitHub, please wait...');
        childProcess.execSync("git pull origin main");
        if (args[0] === 'restart') {
            BotState.persist("restartMessage", message.id);
            BotState.persist("restartChannel", message.channel.id);
            await repliedMessage.edit('Updated!\nBot is restarting...');
            await HostUtility.restart();
        } else {
            repliedMessage.edit('Updated!');
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
