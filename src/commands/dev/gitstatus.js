const childProcess = require("child_process");

const configuration = require("../../config.js");

const env = require("../../util/env-util.js");
const BaseCommand = require("../../classes/base-command.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "gitstatus";
        this.description = "View Git changes";
        this.attributes = {
            unlisted: true,
            permission: 3,
        };
    }

    async invoke(message, args) {
        if (env.getBool("DISABLE_GIT")) return message.reply('Variable `DISABLE_GIT` is set to true on this host.');

        const changes = childProcess.execSync("git -c color.status=always status -s").toString("utf8");
        if (!changes.trim())
            return message.reply("There are no changes to show.");
        message.reply("```ansi\n" + changes.substring(0, 1989) + "```");
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
