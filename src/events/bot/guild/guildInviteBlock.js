const discord = require("discord.js");

const configuration = require("../../../config.js");

const env = require("../../../util/env-util.js");
const DiscordUtility = require("../../../util/utility-discord.js");
const BotEventEmitter = require("../../../util/bot-event-emitter.js");

const BaseBotEvent = require("../../../classes/base-bot-event.js");

class BotEvent extends BaseBotEvent {
    constructor() {
        super();
        this.listener = "userSentMessage";
        this.once = false;

        this.handler = BotEventEmitter;
    }

    /**
     * Runs when the event is invoked
     * @param {import("discord.js").Message} message
     * @returns {Promise<any>}
     */
    async invoke(message) {
        if (!env.getBool("REPORT_INAPPROPRIATE_INVITES"))
            return;
        if (!message.content) return;

        // only in our known servers
        const isTestingInPublic = this.isInTestMode && !(configuration.servers.testing.includes(message.guildId));
        const isAllowedServer = configuration.servers.production.includes(message.guildId) ||
            configuration.servers.testing.includes(message.guildId);
        if (isTestingInPublic) return;
        if (!isAllowedServer) return;

        // ignore #team-wanted
        if (message.channel.id === configuration.channels.teamWanted || (message.channel.parent && message.channel.parent.id === configuration.channels.teamWanted))
            return;

        // check if non perm user is sending invite
        // TODO: We should probably check if the user can bypass automod instead
        if (DiscordUtility.getPermissionLevel(message) >= 2) return;
        if (!DiscordUtility.containsInvite(message.content, { includeShorteners: true }))
            return;

        // block invite shorterners
        // TODO: Make this configurable
        const containsDscGG = DiscordUtility.containsInviteShorteners(message.content);
        if (containsDscGG) {
            try { await message.delete(); } catch {}
            await message.author.send(`:warning: **Discord Invite URL shorteners are not allowed in the ${configuration.nameReference} server.**`
                + `\nPlease use the original invite link instead.`);
            return;
        }

        // dont let them send too many invites
        const invites = DiscordUtility.extractInvites(message.content, {
            includeShorteners: false,
            inviteCodes: true
        });
        // TODO: Make this configurable
        if (invites.length > 2) {
            try { await message.delete(); } catch { }
            await message.author.send(`:warning: You sent too many invites in one message in the ${configuration.nameReference} server. Use less invites!`);
            return;
        }

        // TODO: Limit the amount of invites sent. If a user sends too many NSFW invites, its likely a hacked account and should be autobanned.
        // TODO: Make this configurable whether to even do nsfw check or not
        const logChannel = await this.client.channels.fetch(configuration.channels.automod);
        if (!logChannel) return;

        let naughtyInviteCode = null;
        let naughtyGuildName = null;
        const messageAuthorText = `<@${message.author.id}> (${message.author.id})`;
        for (const inviteCode of invites) {
            try {
                const invite = await this.client.fetchInvite(inviteCode);
                const guild = invite.guild;
                if (!guild) continue;

                const guildName = String(guild.name || "");

                // TODO: Make this configurable (either name and nsfw check, or solo name check, solo nsfw check)
                const guildNSFW = guild.nsfwLevel === discord.Constants.NSFWLevels.EXPLICIT || guild.nsfwLevel === discord.Constants.NSFWLevels.AGE_RESTRICTED;
                // NOTE: Maybe at some point we should add more words to this, 🤷‍♂️
                const nameIsUnsafe = !!(guildName.replace(/\s/g, "").match(/(18\+|nsfw|onlyfans|boobs|porn|hentai|momm|moms|dick|yiff|🔞|🍑|🍆)/i));
                if (guildNSFW || nameIsUnsafe) {
                    naughtyInviteCode = inviteCode;
                    naughtyGuildName = guildName;
                    break;
                }
            } catch {
                // likely invalid invite or something went weird in the request
                continue;
            }
        }

        // log nsfw server
        if (!naughtyInviteCode) return;
        const embed = new discord.MessageEmbed();
        embed.setColor("RED");
        embed.setTitle("User sent NSFW server invite");
        embed.setFields([
            {
                name: "Invite code",
                value: naughtyInviteCode || "(unknown)"
            },
            {
                name: "Server name",
                value: naughtyGuildName || "(unknown)"
            },
            {
                name: "Member who sent invite",
                value: messageAuthorText
            }
        ]);
        embed.setFooter({ text: "Member has been timed out for 1 hour" });
        embed.setTimestamp(Date.now());
        await logChannel.send({
            embeds: [embed]
        });

        try { await message.delete(); } catch { }
        await message.author.send(`:warning: **Do NOT send NSFW invite links in the ${configuration.nameReference} server.**`
            + `\nYou have been timed out for 1 hour. You may receive further punishment for posting NSFW invite links.`);

        try {
            // TODO: Make this configurable
            await message.member.timeout(60 * 60 * 1000, "Posting NSFW invites"); // 60 minutes
        } catch {
            console.error("Failed to timeout member for NSFW invite link", message.author.id);
        }
    }
}

module.exports = BotEvent;
