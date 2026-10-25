const discord = require('discord.js');

const OptionType = require('../util/optiontype.js');
const BaseCommand = require("../classes/basecommand.js");
const { mathEvaluateRaw } = require("../util/math-evaluate.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "calcgui";
        this.description = "Use a calculator, on Discord.";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };
        this.slash = {
            options: []
        };
    }

    convertSlashCommand(interaction) {
        interaction.author = interaction.member.user;
        return [interaction];
    }

    async invoke(message) {
        const rows = [
            new discord.MessageActionRow().addComponents([
                new discord.MessageButton({
                    customId: 'clear',
                    style: 'DANGER',
                    label: "AC",
                }),
                new discord.MessageButton({
                    customId: '(',
                    style: 'PRIMARY',
                    label: "(",
                }),
                new discord.MessageButton({
                    customId: ')',
                    style: 'PRIMARY',
                    label: ")",
                }),
                new discord.MessageButton({
                    customId: '/',
                    style: 'PRIMARY',
                    label: "➗",
                })
            ]),
            new discord.MessageActionRow().addComponents([
                new discord.MessageButton({
                    customId: '7',
                    style: 'SECONDARY',
                    label: "7",
                }),
                new discord.MessageButton({
                    customId: '8',
                    style: 'SECONDARY',
                    label: "8",
                }),
                new discord.MessageButton({
                    customId: '9',
                    style: 'SECONDARY',
                    label: "9",
                }),
                new discord.MessageButton({
                    customId: '*',
                    style: 'PRIMARY',
                    label: "✖️",
                })
            ]),
            new discord.MessageActionRow().addComponents([
                new discord.MessageButton({
                    customId: '4',
                    style: 'SECONDARY',
                    label: "4",
                }),
                new discord.MessageButton({
                    customId: '5',
                    style: 'SECONDARY',
                    label: "5",
                }),
                new discord.MessageButton({
                    customId: '6',
                    style: 'SECONDARY',
                    label: "6",
                }),
                new discord.MessageButton({
                    customId: '-',
                    style: 'PRIMARY',
                    label: "➖",
                })
            ]),
            new discord.MessageActionRow().addComponents([
                new discord.MessageButton({
                    customId: '1',
                    style: 'SECONDARY',
                    label: "1",
                }),
                new discord.MessageButton({
                    customId: '2',
                    style: 'SECONDARY',
                    label: "2",
                }),
                new discord.MessageButton({
                    customId: '3',
                    style: 'SECONDARY',
                    label: "3",
                }),
                new discord.MessageButton({
                    customId: '+',
                    style: 'PRIMARY',
                    label: "➕",
                })
            ]),
            new discord.MessageActionRow().addComponents([
                new discord.MessageButton({
                    customId: 'backspace',
                    style: 'PRIMARY',
                    label: "⬅️",
                }),
                new discord.MessageButton({
                    customId: '0',
                    style: 'SECONDARY',
                    label: "0",
                }),
                new discord.MessageButton({
                    customId: '.',
                    style: 'PRIMARY',
                    label: "⚫",
                }),
                new discord.MessageButton({
                    customId: 'result',
                    style: 'SUCCESS',
                    label: "=",
                })
            ]),
        ];

        const msg = await message.reply({
            components: rows,
            embeds: [{
                description: "```\nResults will be displayed here\n```",
                color: "BLUE"
            }],
            fetchReply: true,
            ephemeral: true
        });

        let data = "";

        const col = msg.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 600000
        });

        col.on('collect', async (i) => {
            let extra = "";

            if (i.customId === "result") {
                try {
                    data = mathEvaluateRaw(data);
                } catch (e) {
                    data = "";
                    extra = "An error occurred! Please click on the \"AC\" button to restart.";
                }
            } else if (i.customId === "clear") {
                data = "";
                extra = "Results will be displayed here"
            } else if (i.customId === "backspace") {
                data = data.slice(0, data.length - 2);
            } else {
                const lc = data[data.length - 1];

                data += `${(
                    (parseInt(i.customId) == i.customId || i.customId === ".")
                    &&
                    (lc == parseInt(lc) || lc === ".")
                ) || data.length === 0 ? "" : " "}` + i.customId;
            }

            i.update({
                embeds: [{
                    color: "BLUE",
                    description: `\`\`\`\n${data || extra}\n\`\`\``
                }]
            })
        })

        col.on('end', () => {
            msg.edit({
                components: [new discord.MessageActionRow().addComponents([
                    new discord.MessageButton({
                        label: "This calculator is closed.",
                        disabled: true,
                        style: "DANGER",
                        customId: "_1_"
                    })
                ])]
            })
        })
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;