const discord = require("discord.js");
const { PenguinModAPIError } = require("penguinmod");

const OptionType = require('../../util/optiontype.js');
const CommandRegistry = require("../../util/command-registry.js");
const PenguinModClient = require("../../util/penguinmod-client.js");
const PenguinModFormat = require("../../util/penguinmod-format.js");

const BaseCommand = require("../../classes/base-command.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "project";
        this.description = "Get details about a project using its ID or searching by name.";
        this.attributes = {
            permission: 0,
            lockedToCommands: true,
        };
        this.example = [
            { text: `{{prefix}}project 4023876129249` },
            { text: `{{prefix}}project #games` },
        ];
    }

    async invoke(message, args, util) {
        const projectId = args.join(" ");
        if (!projectId)
            return message.reply('Please specify a project ID or query.');

        try {
            const project = await PenguinModClient.projects.getProjectMeta(projectId);
            message.reply({ embeds: [PenguinModFormat.embedProject(project, { unknown: true })] });
        } catch (err) {
            // first check if this isnt an API error
            if (!(err instanceof PenguinModAPIError))
                throw err;

            // if its project not found then it can be ignored so we can try searching
            // we handle searching by just handing off the query to search command
            if (err.message === "Project not found") {
                const searchCommand = CommandRegistry.commands.get("search");
                if (!searchCommand)
                    throw new Error("No search command found");
                return searchCommand.invoke(message, args, util);
            }

            throw err;
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;