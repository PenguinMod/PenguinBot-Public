const configuration = require("../../config");

const BaseCommand = require("../../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "delmsg";
        this.description = "you cant use it loser";
        this.attributes = {
            unlisted: true,
            permission: 2,
        };

        this.alias = ["deletemessage", "deletemsg", "delmessage"];
    }

    reject(message) {
        return message.reply({
            content: '<:haha:1124199185021927528>'
        });
    }

    async invoke(message, args, util) {
        if (!configuration.permissions.delmsg.includes(message.author.id))
            return this.reject(message);

        const replyMsg = await util.getReply();
        return replyMsg.delete();
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
