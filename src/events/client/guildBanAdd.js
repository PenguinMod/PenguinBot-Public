const axios = require('axios');
const discord = require("discord.js");

const configuration = require("../../config.js");

const env = require("../../util/env-util.js");

function displayNameSpooky(user) {
    if (!user) return "Unknown";
    if (Number(user.discriminator) !== 0) return `${user.username}#"${user.discriminator}`;
    return `@${user.username}`;
}

class BotEvent {
    constructor(client) {
        this.listener = "guildBanAdd";
        this.once = false;
        this.productionOnly = true;

        this.client = client;
    }

    async invoke(client, state, ban) {
        if (!(env.getBool("REPORT_BAN_TO_USER") || env.getBool("REPORT_BAN_TO_WEBHOOK")))
            return;
        if (ban.guild.id !== env.get("SERVER_ID"))
            return;

        // get the general ban info
        // NOTE: While we do *try* to send these logs, there are many cases where they wont send anyway. Not interested in adding a backup log ATM due to WickBot and others being much more reliable for handling bans.
        const userId = ban.user.id;
        const banObject = await ban.guild.bans.fetch(userId).catch(() => { });
        if (!banObject) return;

        const banReasonDisplay = banObject.reason || "*Not specified.*";
        const memberDisplay = displayNameSpooky(banObject.user);

        // send to user
        if (env.getBool("REPORT_BAN_TO_USER")) {
            try {
                const embedForDM = new discord.MessageEmbed();
                embedForDM.setTitle(`Banned from the ${configuration.nameReference} Discord Server`);
                embedForDM.setColor("#ff0000");
                embedForDM.setDescription(`**You've been banned from the ${configuration.nameReference} Discord server.**`
                    + "\n" + `Be careful in the future to follow the rules of the ${configuration.nameReference} community.`
                    + "\n"
                    + "\n" + `**Ban reason**:`
                    + "\n" + `${banReasonDisplay}`);
                await ban.user.send({
                    embeds: [embedForDM],
                    allowedMentions: {
                        parse: [],
                        users: [],
                        roles: [],
                        repliedUser: false
                    }
                });
            } catch (err) {
                console.error(err);
            }
        }

        // send to webhook
        if (env.getBool("REPORT_BAN_TO_WEBHOOK")) {
            // get the mod ban info
            let moderatorDisplay = "Unknown";
            try {
                // NOTE: Discord usually times this perfectly but this *is* a race condition
                // TODO: fetch more than 1 and make sure the id matches
                const fetchedLogs = await banObject.guild.fetchAuditLogs({
                    limit: 1,
                    type: discord.GuildAuditLogs.Actions.MEMBER_BAN_ADD,
                });

                const banLog = fetchedLogs.entries.first();
                moderatorDisplay = banLog && banLog?.target?.id === banObject.user.id ? displayNameSpooky(banLog.executor)
                    : "Unknown";
            } catch {
                moderatorDisplay = "Unknown";
            }

            try {
                await axios({
                    method: "POST",
                    url: env.get("BAN_LOG_WEBHOOK"),
                    headers: { "Content-Type": "application/json" },
                    data: {
                        embeds: [{
                            title: "Member Banned",
                            description: `**Member:** ${memberDisplay} (<@${userId}>, ${userId})\n`
                                + `**Reason:** ${banReasonDisplay}\n`
                                + `**Moderator:** ${moderatorDisplay}`,
                            color: 0xff2222,
                            timestamp: (new Date()).toISOString(),
                        }],
                        allowedMentions: {
                            parse: [],
                            users: [],
                            roles: [],
                            repliedUser: true
                        }
                    },
                });
            } catch (err) {
                console.error(err);
            }
        }
    }
}

module.exports = BotEvent;
