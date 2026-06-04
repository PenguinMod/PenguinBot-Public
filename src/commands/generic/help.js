const discord = require("discord.js");
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

        this.client = client;
    }

    convertSlashCommand(interaction, util) {
        const text = `${interaction.options.getString('command') || ''}`;
        interaction.author = interaction.member.user;
        const args = text.split(' ');
        return [interaction, text ? args : [], util, true];
    }

    async handleSendingList(message, embed, commands, util, args) {
        // set to list
        embed.setTitle("Command List");
        const text = [];
        let commandCount = 0;
        let lastCommandName = "";
        for (const commandName of Object.keys(commands).sort()) {
            const command = commands[commandName];
            // remove alias commands
            if (command.name === lastCommandName) {
                continue;
            }
            lastCommandName = command.name;

            // make sure to do this kids
            let permission = command.attributes.permission || 0;

            if (
                (command.attributes.unlisted === true || util.getPermissionLevel(message) < 0) &&
                !(util.getPermissionLevel(message) >= permission && args[0] === 'all')
            ) {
                continue
            }

            const description = command.description;
            text.push(`**${commandName}** - ${description}`);
            commandCount++;
        }
        const commandOnOnePage = 8;
        const maxPages = Math.ceil(commandCount / commandOnOnePage);

        const buttonRow = [
            new discord.MessageActionRow().addComponents([
                new discord.MessageButton({
                    customId: 'last',
                    style: 'PRIMARY',
                    label: "◀",
                }),
                new discord.MessageButton({
                    customId: 'next',
                    style: 'PRIMARY',
                    label: "▶",
                })
            ])
        ];

        const setDesc = (page) => {
            const commands = text.slice(page * commandOnOnePage, (page + 1) * commandOnOnePage);
            embed.setDescription(commands.join('\n'));
            embed.setFooter({ text: `Page ${page + 1} - ${maxPages} | ${text.length} commands | Developed by MubiLop & PenguinMod` });
        };
        let page = 0;
        setDesc(page);
        const commandListMessage = await message.reply({
            embeds: [embed],
            components: buttonRow,
            ephemeral: true,
            fetchReply: true,
        });

        const collector = commandListMessage.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 180000 // 3 minutes
        });

        collector.on('collect', async (i) => {
            if (i.customId === "last") {
                page--;
                if (page < 0) {
                    page = 0;
                }
            } else if (i.customId === "next") {
                page++;
                if (page > (maxPages - 1)) {
                    page = (maxPages - 1);
                }
            }

            setDesc(page);

            i.update({
                embeds: [embed]
            });
        });
        collector.on('end', () => {
            commandListMessage.edit({
                embeds: [embed],
            })
        });
    }

    async invoke(message, args, util, usingSlash) {
        usingSlash = usingSlash === true;

        const prefix = util.request("prefix");
        const commands = util.request('commands');
        const embed = new discord.MessageEmbed();
        const files = [];
        embed.setColor("#00c3ff");

        // explain a command?
        if (args.length > 0 && args[0] !== 'all') {
            // we are explaining a command
            const commandName = args[0];
            const command = commands[commandName];
            const isAdmin = util.getPermissionLevel(message) > 0;
            let shouldExplainCommand = true;
            if (commandName in commands) {
                // command found
                if (!isAdmin) {
                    if (command.attributes.unlisted) {
                        // command is unlisted (likely a secret command, shouldnt explain secrets)
                        shouldExplainCommand = false;
                    }
                }
            } else {
                // not found
                shouldExplainCommand = false;
            }

            if (!shouldExplainCommand) {
                embed.setTitle("Command not found");
                embed.setFooter({
                    text: `Run "${usingSlash ? '/' : prefix}help" on its own to view all commands.`
                });
                embed.setDescription("The command either does not exist or is an admin-only command.");
            } else {
                embed.setTitle(`How to use ${usingSlash ? '/' : prefix}${commandName}`);
                let text = `${command.description}`;
                if (command.example) {
                    // we have examples for this command
                    text += "\n\n**Usage:**\n";
                    for (const example of command.example) {
                        text += `\`\`${example.text}\`\``;
                        if (example.image) {
                            files.push(`assets/examples/${example.image}`);
                            text += ` *[image ${files.length}]*`;
                        }
                        text += '\n';
                    }
                }
                embed.setDescription(text);
            }
        } else {
            return this.handleSendingList(message, embed, commands, util, args);
        }

        const messageOptions = {
            embeds: [embed],
            ephemeral: true
        };
        if (files.length > 0) {
            // only 1 image can be used in embeds
            messageOptions.files = files;
            const file = files[0];
            const filename = file.split('/')[1];
            embed.setImage(`attachment://${filename}`);
        }
        message.reply(messageOptions);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
