const childProcess = require("child_process");

const env = require("../../util/env-util");
const BotState = require("../../util/bot-state.js");
const BaseCommand = require("../../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "push";
        this.description = "Push to branch";
        this.attributes = {
            unlisted: true,
            permission: 1,
        };
    }

    async invoke(message, args) {
        if (BotState.request('preventRuntimeChanges')) return message.reply('Variable `PREVENT_UPDATES` is set to true on this host.');
        if (env.getBool("DISABLE_GIT")) return message.reply('Variable `DISABLE_GIT` is set to true on this host.');
        if (env.getBool("DISABLE_GIT_WRITE")) return message.reply('Variable `DISABLE_GIT_WRITE` is set to true on this host.');
        
        const provided = args.join(' ');
        if (!provided) return message.reply('Provide a commit name!');
        const commitName = JSON.stringify(provided.substring(0, 35).replace(/[^a-z0-9 ]/gi, ""));
        const repliedMessage = await message.reply('Pushing changes to the GitHub, please wait...');
        childProcess.execSync('git commit -a -m ' + commitName);
        childProcess.execSync('git push origin main');
        repliedMessage.edit('Updated!');
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;