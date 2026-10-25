const childProcess = require("child_process");

const env = require("../../util/env-util.js");
const BotState = require("../../util/bot-state.js");
const BaseCommand = require("../../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "installmodule";
        this.description = "install modules";
        this.attributes = {
            unlisted: true,
            permission: 3,
        };
    }

    async invoke(message, args) {
        if (env.getBool("DISABLE_ARBITRARY_OS_LEVEL_CODE"))
            return message.reply("Variable `DISABLE_ARBITRARY_OS_LEVEL_CODE` is set to true on this host.");
        if (BotState.request('preventRuntimeChanges'))
            return message.reply('Variable `PREVENT_UPDATES` is set to true on this host.');
        
        const repliedMessage = await message.reply(`Installing ${args[0] ? `\`\`${args.join(' ')}\`\`` : 'modules'}, please wait...`);
        childProcess.execSync(`npm i ${args.join(' ')} --force`);
        repliedMessage.edit('Updated!');
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;