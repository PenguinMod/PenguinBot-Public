const BaseCommand = require("../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "killeveryoneinthisserver";
        this.description = "i dont like you";
        this.attributes = {
            unlisted: true
        };
    }

    invoke(message) {
        message.reply("erm,,, incorrect");
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;