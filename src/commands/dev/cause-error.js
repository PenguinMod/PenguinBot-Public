const BaseCommand = require("../../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "cause-error";
        this.description = "moyai emoji";
        this.attributes = {
            unlisted: true,
            permission: 3
        };
    }

    invoke() {
        void this.client.client.client.client;
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;