const discord = require('discord.js');

const EventXP = require("../../util/event-xp.js");
const ProgressBar = require("../../util/progress-bar.js");
const DiscordUtility = require("../../util/utility-discord.js");

const BaseCommand = require("../../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "eventxp";
        this.description = "View the leaderboard of XP, or a specific user.";
        this.descriptionLong = "View the leaderboard of XP, or a specific user."
            + "\n" + "- Run the command standalone to see the leaderboard."
            + "\n" + "- Mention a user or a user's ID to view their XP."
            + "\n"
            + "\n" + "You can earn <:favorite:1158864719764017212> Event XP by participating in or winning PenguinMod events."
            + "\n" + "This includes certain Discord activities and website events like PenguinJams.";
        this.attributes = {
            unlisted: false,
        };
    }

    /**
     * @param {import("discord.js").Message} message 
     * @param {import("discord.js").User} user 
     * @param {import("../../util/utility-command.js")} util 
     */
    async viewUserXp(message, user, util) {
        const stats = await EventXP.get(user.id);
        const userImage = (user?.avatarURL({ format: "png" }) ?? user?.user?.avatarURL({ format: "png" }))
            || "https://penguinmod.com/badges/featured_creator.png";

        const embed = new discord.MessageEmbed();
        embed.setTitle("Event XP");
        embed.setColor('#ffca58');
        embed.setThumbnail(userImage);
        embed.setDescription(`<:favorite:1158864719764017212> **Level ${stats.level}** - ${stats.xp} XP`
            + "\n" + ProgressBar("yellow", 10, ((EventXP.xpPerLevel - stats.xpToNextLevel) / EventXP.xpPerLevel) * 100)
            + "\n" + "-#" + " " + `Ranked #${stats.rank} on the leaderboard`);
        embed.setFooter({ text: `Remaining: ${stats.xpToNextLevel} XP to next level` });

        message.reply({
            embeds: [embed],
        });
    }
    /**
     * @param {import("discord.js").Message} message 
     * @param {string[]} args 
     * @param {import("../../util/utility-command.js")} util 
     */
    async displayLeaderboard(message, args, util) {
        const embed = new discord.MessageEmbed();
        embed.setColor("#ffca58");
        embed.setThumbnail("https://penguinmod.com/badges/featured_creator.png");
        embed.setTitle("Event XP Leaderboard");

        // create the list message
        const usersOnOnePage = 12;
        let maxPages = 1;
        let buttonRow = [];

        // handle element updates
        let page = 0;
        let disabled = false;
        const setElements = async (page) => {
            const userPage = await EventXP.getLeaderboard(page, usersOnOnePage);
            maxPages = userPage.totalPages;

            const userList = userPage.entries.map(user => `**${user.rank}.** <@${user.userId}> — Lvl ${user.level} • ${user.xp} XP`);
            embed.setDescription(userList.join('\n') || "Nothing to show here!");
            
            const userDetails = await EventXP.get(message.author.id);
            embed.setFooter({ text: `Page ${page + 1} - ${maxPages} | You are ranked #${userDetails.rank}` });

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
        await setElements(page);
        const userListMessage = await message.reply({
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
        const collector = userListMessage.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 5 * 60 * 1000 // 5 minutes
        });
        collector.on('collect', async (i) => {
            if (i.customId === "last") {
                page = Math.max(0, page - 1);
            } else if (i.customId === "next") {
                page = Math.min(page + 1, maxPages - 1);
            }

            await setElements(page);
            i.update({
                embeds: [embed],
                components: buttonRow,
            });
        });
        collector.on('end', async () => {
            disabled = true;
            await setElements(page);
            userListMessage.edit({
                embeds: [embed],
                components: buttonRow,
            })
        });
    }

    async invoke(message, args, util) {
        const potentialMention = args[0];
        const resolvedUser = await DiscordUtility.resolveMention(potentialMention);
        if (resolvedUser) {
            EventXP.registerLocal(resolvedUser.id, { username: resolvedUser.username });
            return this.viewUserXp(message, resolvedUser, util);
        } else {
            EventXP.registerLocal(message.author.id, { username: message.author.username });
            return this.displayLeaderboard(message, args, util);
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;