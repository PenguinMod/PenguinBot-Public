const discord = require("discord.js");
const { PenguinModAPIError } = require("penguinmod");

const OptionType = require('../../util/optiontype.js');
const BaseCommand = require("../../classes/base-command.js");
const PenguinModClient = require("../../util/penguinmod-client.js");
const PenguinModFormat = require("../../util/penguinmod-format.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "search";
        this.description = "Search for PenguinMod projects.";
        this.attributes = {
            permission: 0,
            lockedToCommands: true,
        };
        this.example = [
            { text: `{{prefix}}search #games` },
            { text: `{{prefix}}search sigma` },
        ];
    }

    /**
     * @param {import("discord.js").Message} message 
     * @param {string[]} args 
     * @param {import("../../util/utility-command.js")} util 
     */
    async invoke(message, args, util) {
        const searchQuery = args.join(' ');
        const projectSearch = await PenguinModClient.projects.searchProjects({ query: searchQuery });
        const projects = projectSearch.projects;
        if (projects.length <= 0)
            return message.reply('No projects fit the search query. <:pm_idk:1170681434751631410>');
        if (projects.length === 1)
            return message.reply({ embeds: [PenguinModFormat.embedProject(projects[0], { unknown: true })] });

        // NOTE: max 25 options
        const row = new discord.MessageActionRow()
            .addComponents(
                new discord.MessageSelectMenu()
                    .setCustomId('projectDropdown')
                    .setPlaceholder('Select a project')
                    .addOptions([
                        ...(projects.slice(0, 24).map((project, i) => ({
                            label: `${project.title}`.substring(0, 100),
                            description: `Project ${i + 1} by ${typeof project.author === "string" ? project.author : project.author.username}`.substring(0, 100),
                            emoji: project.featured ? "⭐"
                                : (project.remix && project.remix !== "0" ? "🌀" : "🎮"),
                            value: `project-${project.id}`,
                        }))),
                        ...(projects.length > 1 ? [{
                            label: "Random",
                            description: "Choose a random project from the results",
                            emoji: "👀",
                            value: "__random",
                        }] : [])
                    ])
            );
        const replyMessage = await message.reply({
            content: `Choose a project in the menu below. Only the first page of results is shown.`,
            components: [row],
        });

        // listen for button presses by the requester
        let selectedOption = false;
        const collector = replyMessage.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 5 * 60 * 1000 // 5 minutes
        });
        collector.on('collect', async (i) => {
            if (!i.isSelectMenu()) return;
            const selectedValue = i.values[0];
            selectedOption = true;

            const project = selectedValue === "__random" ? projects[Math.floor(Math.random() * projects.length)]
                : projects.find(project => project.id === selectedValue.slice(8));
            replyMessage.edit({
                content: "Searched for a project:",
                embeds: [PenguinModFormat.embedProject(project, { unknown: true })],
                components: [],
            });
        });
        collector.on('end', () => {
            if (selectedOption)
                return;
            
            selectedOption = true;
            replyMessage.edit({
                content: "This menu has expired.",
                embeds: [],
                components: [],
            });
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;