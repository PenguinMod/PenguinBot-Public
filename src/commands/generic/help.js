const fs = require("fs/promises");

const discord = require("discord.js");

const stateFill = require("../../util/state-fill.js");
const OptionType = require('../../util/optiontype');

class Command {
    constructor(client) {
        this.name = "help";
        this.description = "Lists all usable commands";
        this.attributes = {
            unlisted: true,
            permission: 0,
        };
        this.slash = {
            options: [{
                type: OptionType.STRING,
                name: 'command',
                required: false,
                description: 'Command to get help for. (optional)'
            }]
        };

        this.alias = ["commands", "cmds"];

        this.client = client;
    }

    convertSlashCommand(interaction, util) {
        const text = `${interaction.options.getString('command') || ''}`;
        interaction.author = interaction.member.user;
        const args = text.split(' ');
        return [interaction, text ? args : [], util, true];
    }

    getCommandIcon(command) {
        if (command.attributes && command.attributes.helpIcon) return command.attributes.helpIcon;
        if (command.attributes.exclusive) return "<:gold_pengin:1158864673861537864>";
        if (command.attributes.spaceOwner) return "📰";
        if (command.attributes.lockedToHelp) return "📙";
        if (command.attributes.lockedToChannels) return "🔒";
        if (command.attributes.lockedToCommands) return "🤖";
        return "👤";
    }
    async handleSendingList(message, args, util) {
        const commands = util.request('commands');
        const embed = new discord.MessageEmbed();
        embed.setColor("#00c3ff");
        embed.setTitle("Command List");

        const commandsListed = [];
        for (const commandName of Object.keys(commands).sort()) {
            const command = commands[commandName];

            // remove unlisted, nonperms
            const permissionRequired = command.attributes.permission || 0;
            const showUnlistedCommand = util.getPermissionLevel(message) >= 3 && args[0] === 'all';
            if (util.getPermissionLevel(message) < permissionRequired) continue;
            if (command.attributes.unlisted === true && !showUnlistedCommand) continue;

            // add this command to the list
            commandsListed.push(command);
        }

        // create the list message
        const commandOnOnePage = 12;
        const maxPages = Math.ceil(commandsListed.length / commandOnOnePage);
        let buttonRow = [];

        // handle element updates
        let page = 0;
        let disabled = false;
        const setElements = (page) => {
            const commands = commandsListed.slice(page * commandOnOnePage, (page + 1) * commandOnOnePage);
            const commandList = commands.map(command => `${this.getCommandIcon(command)} **${command.name}** — ${command.description}`);
            embed.setDescription(commandList.join('\n'));
            embed.setFooter({ text: `Page ${page + 1} - ${maxPages} | ${commandsListed.length} commands | Developed by MubiLop & PenguinMod` });

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
        const commandListMessage = await message.reply({
            embeds: [embed],
            components: buttonRow,
            ephemeral: true,
            fetchReply: true,
        });

        // listen for button presses by the requester
        const collector = commandListMessage.createMessageComponentCollector({
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
            commandListMessage.edit({
                embeds: [embed],
                components: buttonRow,
            })
        });
    }

    async invoke(message, args, util, usingSlash) {
        // just list all commands?
        if (!args[0] || args[0] === 'all')
            return await this.handleSendingList(message, args, util);

        // we are explaining a command
        const prefix = util.request("prefix");
        const commands = util.request('commands');
        usingSlash = usingSlash === true;

        const embed = new discord.MessageEmbed();
        embed.setColor("#00c3ff");

        const commandName = args[0];
        const command = commands[commandName];
        if (!(commandName in commands) || util.getPermissionLevel(message) <= 0 && command.attributes.unlisted) {
            embed.setTitle("Command not found");
            embed.setDescription("The command either does not exist or is an admin-only command.");
            embed.setFooter({ text: `Run "${usingSlash ? '/' : prefix}help" on its own to view all commands.` });
            return message.reply({ embeds: [embed], ephemeral: true });
        }

        // show the info for this command
        embed.setTitle(`How to use ${usingSlash ? '/' : prefix}${commandName}`);

        const imagePath = command.exampleImage || (!command.example ? null : command.example.map(example => example.image ? `assets/examples/${example.image}` : null).at(0));
        embed.setDescription(stateFill(command.descriptionLong || command.description));
        if (command.alias) {
            embed.addFields({
                name: "Aliases",
                value: command.alias.join(", "),
            });
        }
        if (command.example) {
            embed.addFields({
                name: "Usage",
                value: command.example.map(example => stateFill(`\`\`${example.text}\`\``)).join("\n"),
            });
        }

        const files = [];
        if (imagePath) {
            const imageBuffer = await fs.readFile(imagePath);
            const attachment = new discord.MessageAttachment(imageBuffer, 'example.png');
            embed.setImage(`attachment://example.png`);
            files.push(attachment);
        }
        message.reply({
            embeds: [embed],
            ephemeral: true,
            files: files.length ? files : null,
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
