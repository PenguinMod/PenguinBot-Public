const discord = require("discord.js");

const configuration = require("../../../config.js");

const env = require("../../../util/env-util.js");
const Utility = require("../../../util/utility.js");
const DiscordUtility = require("../../../util/utility-discord.js");
const CommandUtility = require("../../../util/utility-command.js");
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
        if (!env.getBool("REPORT_AUTOMOD_BYPASS"))
            return;
        if (message.guildId !== env.get("SERVER_ID"))
            return;

        // people with perms can bypass automod
        // TODO: Maybe we should check if they have the actual permission that lets people bypass automod
        const isTestingInPublic = this.isInTestMode && !(configuration.servers.testing.includes(message.guildId));
        if (isTestingInPublic) return;
        if (DiscordUtility.getPermissionLevel(message) < 2) return;
        
        const automodReportChannel = await this.client.channels.fetch(configuration.channels.automod);
        if (!automodReportChannel) return;

        // third arg makes it return null on safe and the blcoked word on unsafe
        // if the original is against the rules already then we assume our filter check was incorrect compared to Discord (since the user wouldnt have been able to send it)
        const messageChecked = message.content;
        const originalAgainstRules = DiscordUtility.automodAllows(messageChecked, false, true);
        const actuallyAgainstRules = DiscordUtility.automodAllows(messageChecked, true, true);
        if (originalAgainstRules || !actuallyAgainstRules) return;
        
        // automod was bypassed for this message
        const embed = new discord.MessageEmbed();
        embed.setTitle("AutoMod Bypassed");
        embed.setAuthor({
            name: message.author.displayName || message.author.username,
            iconURL: DiscordUtility.avatarURL(message.author, { format: "png" }),
        });
        embed.setDescription(messageChecked);
        embed.addFields([
            {
                name: "Keyword",
                value: actuallyAgainstRules
            },
            {
                name: "Jump to Message",
                value: DiscordUtility.makeMessageLink(message),
            }
        ]);
        embed.setColor(0xff9900);
        // TODO: Config to delete them anyway
        embed.setFooter({ text: "Bypassed messages are not blocked in the case of a false-alert." });
        automodReportChannel.send({
            embeds: [embed],
            allowedMentions: {
                parse: [],
                users: [],
                roles: [],
                repliedUser: false
            }
        });
    }
}

module.exports = BotEvent;
