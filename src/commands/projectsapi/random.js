const discord = require("discord.js");

const OptionType = require('../../util/optiontype.js');
const BaseCommand = require("../../classes/basecommand.js");
const PenguinModClient = require("../../util/penguinmod-client.js");
const PenguinModFormat = require("../../util/penguinmod-format.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "random";
        this.description = "Gets a random PenguinMod project.";
        this.attributes = {
            permission: 0,
            lockedToCommands: true,
        };
        this.slash = {
            options: []
        };
    }

    convertSlashCommand(interaction) {
        return [interaction];
    }

    async invoke(message) {
        const randomProjects = await PenguinModClient.projects.getRandomProjects();
        const project = randomProjects[0];
        message.reply({ embeds: [PenguinModFormat.embedProject(project, { unknown: true })] });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
