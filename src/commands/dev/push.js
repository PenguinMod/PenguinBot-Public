const childProcess = require("child_process");

const env = require("../../util/env-util");

class Command {
    constructor() {
        this.name = "push";
        this.description = "Push to branch";
        this.attributes = {
            unlisted: true,
            permission: 1,
        };
    }

    async invoke(message, args, util) {
        if (util.request('preventRuntimeChanges')) return message.reply('Variable `PREVENT_UPDATES` is set to true on this host.');
        if (env.getBool("DISABLE_GIT")) return message.reply('Variable `DISABLE_GIT` is set to true on this host.');
        if (env.getBool("DISABLE_GIT_WRITE")) return message.reply('Variable `DISABLE_GIT_WRITE` is set to true on this host.');
        
        const provided = args.join(' ');
        if (!provided) return message.reply('Provide a commit name!');
        const commitName = JSON.stringify(provided.substring(0, 35));
        const repliedMessage = await message.reply('Pushing changes to the GitHub, please wait... <:juice:1158872031211831377>');
        childProcess.execSync('git commit -a -m ' + commitName);
        childProcess.execSync('git push origin main');
        repliedMessage.edit('Updated! <:good:1118293837773807657>');
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;