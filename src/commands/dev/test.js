const OptionType = require("../../util/optiontype.js");
const BaseCommand = require("../../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "test";
        this.description = "poo poo";
        this.attributes = {
            unlisted: true,
            permission: 1,
        };
    }

    invoke(message, args, util) {
        message.reply({
            content: JSON.stringify(args),
            allowedMentions: {
                parse: [],
                users: [],
                roles: [],
                repliedUser: true
            }
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;