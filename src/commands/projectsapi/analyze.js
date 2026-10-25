const discord = require("discord.js");
const { PenguinModAPIError } = require("penguinmod");

const OptionType = require('../../util/optiontype.js');
const BaseCommand = require("../../classes/basecommand.js");
const PenguinModClient = require("../../util/penguinmod-client.js");
const PenguinModAnalyze = require("../../util/penguinmod-analyze.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "analyze";
        this.description = "Analyze a PenguinMod project by it's ID to get info about it's contents.";
        this.attributes = {
            permission: 0,
            lockedToCommands: true,
        };
        this.example = [
            { text: `{{prefix}}analyze 4023876129249`, image: "analyze_example1.png" },
            { text: `{{prefix}}analyze (project id)` },
        ];
        this.slash = {
            options: [{
                type: OptionType.INTEGER,
                name: 'project',
                required: true,
                description: 'A PenguinMod project ID.'
            }]
        };
    }

    convertSlashCommand(interaction) {
        const id = interaction.options.getInteger('project');
        interaction.deferReply()
        interaction.reply = interaction.editReply
        return [interaction, [id], true];
    }

    async invoke(message, [projectId], isMessage) {
        isMessage = isMessage !== true
        if (isMessage) message.channel.sendTyping();
        
        try {
            const project = await PenguinModClient.projects.getProjectMeta(projectId);
            const arrayBufferCard = await PenguinModAnalyze.visualizeCard(project);
            const bufferCard = Buffer.from(arrayBufferCard);
            message.reply({
                content: `Here is my analysis of "${project.title}" by ${project.author.username}:`,
                files: [bufferCard],
                allowedMentions: {
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: true
                }
            });
        } catch (err) {
            if (err && err instanceof PenguinModAPIError && err.httpCode === 404)
                return message.reply('No project was found. Please check the ID again.');
            throw err;
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
