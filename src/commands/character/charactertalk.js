const discord = require("discord.js");

const Canvas = require("skia-canvas");

const BaseCommand = require("../../classes/basecommand.js");
const CharacterManager = require("../../util/character-manager.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "charactertalk";
        this.description = "In development";
        this.attributes = {
            helpIcon: "😃",
            unlisted: true, // TODO: Temp
            permission: 0,
        };

        this.alias = ["talkcharacter", "chartalk", "talkchar"];
    }

    invoke(message, args, util) {
        throw new Error("Not implemented");
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;