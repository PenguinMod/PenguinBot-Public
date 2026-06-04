const OptionType = require('../util/optiontype');

class Command {
    constructor() {
        this.name = "toiletpaper";
        this.description = "Toilet Paper... NOW!";
        this.attributes = {
            unlisted: true,
            permission: 0,
        };
    }

    invoke(message) {
        message.reply({
            files: ["./assets/randomImages/toiletpaper.png"]
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;