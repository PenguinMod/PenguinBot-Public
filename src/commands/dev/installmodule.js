const childProcess = require("child_process");

class Command {
    constructor() {
        this.name = "installmodule";
        this.description = "install modules";
        this.attributes = {
            unlisted: true,
            permission: 3,
        };
    }

    async invoke(message, args, util) {
        if (util.request('preventRuntimeChanges')) return message.reply('Variable `PREVENT_UPDATES` is set to true on this host.');
        
        const repliedMessage = await message.reply(`Installing ${args[0] ? `\`\`${args.join(' ')}\`\`` : 'modules'}, please wait... <:juice:1158872031211831377>`);
        childProcess.execSync(`npm i ${args.join(' ')} --force`);
        repliedMessage.edit('Updated! <:good:1118293837773807657>');
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;