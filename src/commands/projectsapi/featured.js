const discord = require("discord.js");

const OptionType = require('../../util/optiontype.js');
const BaseCommand = require("../../classes/base-command.js");
const PenguinModClient = require("../../util/penguinmod-client.js");
const PenguinModFormat = require("../../util/penguinmod-format.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "featured";
        this.description = "Gets the first page of featured projects.";
        this.attributes = {
            permission: 0,
            lockedToCommands: true,
        };

        this.featuredProjects = null;

        // NOTE: this command is similar to the old top5 command
        this.alias = ["top5"];
    }

    async handleSendingList(message, args, util) {
        let embed = new discord.MessageEmbed();
        embed.setTitle("Loading");

        // create the list message
        const maxPages = this.featuredProjects.length;
        let buttonRow = [];

        // handle element updates
        let page = 0;
        let disabled = false;
        const setElements = (page) => {
            embed = PenguinModFormat.embedProject(this.featuredProjects[page]);
            embed.setFooter({ text: `Project ${page + 1} - ${maxPages}` });
            buttonRow = [
                new discord.MessageActionRow().addComponents([
                    new discord.MessageButton({
                        customId: 'last',
                        style: 'PRIMARY',
                        label: "◀",
                        disabled: disabled || page === 0,
                    }),
                    new discord.MessageButton({
                        customId: 'next',
                        style: 'PRIMARY',
                        label: "▶",
                        disabled: disabled || page === (maxPages - 1),
                    })
                ])
            ];
        };
        setElements(page);
        const projectListMessage = await message.reply({
            embeds: [embed],
            components: buttonRow,
            ephemeral: true,
            fetchReply: true,
            allowedMentions: {
                parse: [],
                users: [],
                roles: [],
                repliedUser: true
            }
        });

        // listen for button presses by the requester
        const collector = projectListMessage.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 5 * 60 * 1000 // 5 minutes
        });
        collector.on('collect', async (i) => {
            if (i.customId === "last") {
                page = Math.max(0, page - 1);
            } else if (i.customId === "next") {
                page = Math.min(page + 1, maxPages - 1);
            }

            setElements(page);
            i.update({
                embeds: [embed],
                components: buttonRow,
            });
        });
        collector.on('end', () => {
            disabled = true;
            setElements(page);
            projectListMessage.edit({
                embeds: [embed],
                components: buttonRow,
            })
        });
    }
    
    async invoke(message) {
        try {
            // Make a request to the API
            const featuredProjects = this.featuredProjects
                || (await PenguinModClient.projects.getFeaturedProjects());
            this.featuredProjects = featuredProjects;
            await this.handleSendingList(message);
        } catch (error) {
            console.error('Error displaying projects:', error);
            message.reply('Sorry, there was an error displaying the projects.');
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
