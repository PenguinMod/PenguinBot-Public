const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const Database = require('sync-json-database');
const SusDB = new Database('./databases/suspicious-users.json');

class Command {
    constructor(client) {
        this.name = "sus";
        this.description = "Command to handle suspicious users.";
        this.attributes = {
            unlisted: true,
            permission: 2,
            lockedToChannels: [
                '1176024649390366780',
                '1038252107846930513',
                '1174360726765305987',
                '1109289217152000030',
                '1139749855913316474'
            ],
        };

        this.client = client;
    }

    async fetchUserName(userId) {
        try {
            const user = await this.client.users.fetch(userId);
            return user.username;
        } catch (error) {
            console.error(`Error fetching username of ID ${userId};`, error);
            return 'Unknown User';
        }
    }

    async sendSusList(message) {
        // Fetch the suspects list from the JSON DB
        const suspectIds = SusDB.array("keys"); // use key, data is the sus reason

        const userNamePromises = suspectIds.map(id => this.fetchUserName(id));
        const userNames = await Promise.all(userNamePromises);

        const userContent = suspectIds.map((id, index) => ({
            name: `${userNames[index]} (${id})`,
            value: `${SusDB.get(id)}`
        }));
        const userOnOnePage = 5;
        const userCount = userContent.length;
        const maxPages = Math.ceil(userCount / userOnOnePage);

        const embed = new MessageEmbed()
            .setTitle('Suspicious User List')
            .setColor('GOLD')
            .setTimestamp();

        const buttonRow = [
            new MessageActionRow().addComponents([
                new MessageButton({
                    customId: 'last',
                    style: 'PRIMARY',
                    label: "◀",
                }),
                new MessageButton({
                    customId: 'next',
                    style: 'PRIMARY',
                    label: "▶",
                })
            ])
        ];

        const setFields = (page) => {
            const users = userContent.slice(page * userOnOnePage, (page + 1) * userOnOnePage);
            embed.setFields(users);
            embed.setFooter({ text: `Page ${page + 1} - ${maxPages} | ${userCount} users` });
        };

        let page = 0;
        setFields(page);
        const userListMessage = await message.reply({
            embeds: [embed],
            allowedMentions: {
                parse: [],
                users: [],
                roles: [],
                repliedUser: true
            },
            components: buttonRow,
            fetchReply: true,
        });

        const collector = userListMessage.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 300000 // 5 minutes
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

            setFields(page);

            i.update({
                embeds: [embed]
            });
        });
        collector.on('end', () => {
            userListMessage.edit({
                embeds: [embed],
            })
        });
    }

    async invoke(message, args, util) {
        const prefix = util.request("prefix");
        if (args.length < 1) {
            return message.reply(`Usage: \`${prefix}sus <add/remove/list> userID (reason if adding)\``);
        }

        const action = args[0].toLowerCase();
        const targetUserId = args[1];

        if (!targetUserId && action !== 'list') {
            return message.reply('Please provide a valid user ID.');
        }

        switch (action) {
            case 'add': {
                // remove the subcommand & ID arguments
                args.shift();
                args.shift();
                const susReason = args.join(' ');
                if (!susReason) {
                    return message.reply('Please provide a reason to mark this user as suspicious.');
                }
                SusDB.set(`${targetUserId}`, susReason);
                const userName = await this.fetchUserName(targetUserId);
                message.reply({
                    content: `${userName} (${targetUserId}) added to the suspects list.`,
                    allowedMentions: {
                        parse: [],
                        users: [],
                        roles: [],
                        repliedUser: true
                    }
                });
                break;
            }
            case 'remove': {
                if (SusDB.has(`${targetUserId}`)) {
                    SusDB.delete(`${targetUserId}`);
                    const userName = await this.fetchUserName(targetUserId);
                    message.reply({
                        content: `${userName} (${targetUserId}) removed from the suspects list.`,
                        allowedMentions: {
                            parse: [],
                            users: [],
                            roles: [],
                            repliedUser: true
                        }
                    });
                } else {
                    message.reply({
                        content: `User ${targetUserId} not found in the suspects list.`,
                        allowedMentions: {
                            parse: [],
                            users: [],
                            roles: [],
                            repliedUser: true
                        }
                    });
                }
                break;
            }
            case 'list': {
                this.sendSusList(message);
                break;
            }
            default: {
                message.reply('Invalid action. Use `add`, `remove`, or `list`.');
            }
        }
    }
}

module.exports = Command;
