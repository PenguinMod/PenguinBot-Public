const { MessageEmbed } = require('discord.js');

const Database = require('sync-json-database');
const StarboardCounters = new Database('./databases/starboard-counters.json');
const StarboardMessages = new Database('./databases/starboard-messages.json');

const configuration = require("../../config.js");

const BaseCommand = require("../../classes/base-command.js");

const stars = [
    '✨',
    '✨',
    '💫',
    '💫',
    '💫',
    '🌟',
    '🌟',
    '🌟',
    '🌟',
    '⭐'
];
class Command extends BaseCommand {
    constructor() {
        super();
        this.name = 'top-stars';
        this.description = 'Get the starboard leader board!';
        this.attributes = {
            // TODO: Temp, should be listed & perm 0
            unlisted: true,
            permission: 3,
        };
    }

    produceMessage(board, page, pages) {
        return {
            flags: 1 << 15,
            components: [
                {
                    "type": 17,
                    "components": [
                        {
                            type: 10,
                            content: board
                                .slice(page * 10, (page * 10) +10)
                                .map((ent,idx) => (`${idx + (page * 10) +1}. ${stars[Math.min(stars.length -1, idx + (page * 10))]} ${ent.label} — ${ent.count} stars`))
                                .join('\n')
                        },
                        {
                            "type": 1,
                            "components": [
                                {
                                    "type": 2,
                                    "style": "1",
                                    "label": "<<",
                                    "custom_id": "start"
                                },
                                {
                                    "type": 2,
                                    "style": "1",
                                    "label": "<",
                                    "custom_id": "previous"
                                },
                                {
                                    "type": 2,
                                    "style": "2",
                                    "label": `${page +1}/${pages}`,
                                    "custom_id": "count",
                                    "disabled": true
                                },
                                {
                                    "type": 2,
                                    "style": "1",
                                    "label": ">",
                                    "custom_id": "next"
                                },
                                {
                                    "type": 2,
                                    "style": "1",
                                    "label": ">>",
                                    "custom_id": "end"
                                }
                            ]
                        }
                    ],
                    "accent_color": 15844367,
                    "spoiler": false
                }
            ],
            allowedMentions: {
                users: [],
                roles: [],
                repliedUser: true
            }
        }
    }
    /**
     * Runs when the command is called
     * @param {import("discord.js").Message} message 
     * @param {string[]} args 
     * @param {import("../../util/utility-command.js")} util 
     * @returns {Promise<any>}
     */
    async invoke(message, args) {
        const messages = StarboardCounters.array()
            .map(({ key, value }) => ({
                message: key, 
                channel: value.channel,
                author: value.author,
                count: Object.entries(value)
                        .filter(ent => !['later', 'author', 'channel'].includes(ent[0]))
                        .map(ent => ent[1])
                        .reduce((c,v) => c+v, 0) +
                    Object.entries(value.later ?? {})
                        .filter(ent => !['later', 'author', 'channel'].includes(ent[0]))
                        .map(ent => ent[1])
                        .reduce((c,v) => c+v, 0)
            }));
        let board;
        switch (args[0]) {
        case 'message':
            board = messages
                .sort((a,b) => b.count - a.count)
                .map(meta => ({ label: `(<@${meta.author}>) https://discord.com/channels/${message.guildId}/${meta.channel}/${meta.message}`, count: meta.count }));
            break;
        case 'user':
        default:
            board = Object.entries(messages
                .reduce((total, ent) => {
                    if (!(ent.author in total)) total[ent.author] = 0;
                    total[ent.author] += ent.count;
                    return total;
                }, {}))
                .sort((a,b) => b[1] - a[1])
                .map(user => ({ label: `<@${user[0]}>`, count: user[1] }));
            break;
        }
        const pages = Math.ceil(board.length / 10);
        let page = 0;

        const reply = await message.reply(this.produceMessage(board, page, pages));
        const collector = reply.createMessageComponentCollector({ filter(inter) { return ['start', 'previous', 'next', 'end'].includes(inter.customId) } });
        collector.on('collect', interaction => {
            switch (interaction.customId) {
            case 'start': page = 0; break;
            case 'previous': page--; break;
            case 'next': page++; break;
            case 'end': page = pages; break;
            }
            page = Math.max(0, Math.min(page, pages -1));
            interaction.update(this.produceMessage(board, page, pages));
        })
    }
}

module.exports = Command;
