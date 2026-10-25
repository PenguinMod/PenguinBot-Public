const BaseCommand = require("../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "toiletpaper";
        this.description = "Toilet Paper... NOW!";
        this.attributes = {
            unlisted: true,
            permission: 0,
        };
    }

    invoke(message) {
        return message.reply({
            files: ["./assets/randomImages/toiletpaper.png"]
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;