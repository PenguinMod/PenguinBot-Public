const discord = require("discord.js");

const configuration = require("../../config.js");

const env = require("../../util/env-util.js");
const Utility = require("../../util/utility.js");
const handleInviteBlock = require('../../util/inviteblock.js');
const handlePingMessage = require('../../util/pingmessage.js');
const DiscordUtility = require("../../util/utility-discord.js");
const CommandUtility = require("../../util/utility-command.js");

const handleBotAutoResponse = require('../../resources/responses/index.js');

class BotEvent {
    constructor(client) {
        this.listener = "messageCreate";
        this.once = false;

        this.client = client;
    }

    /**
     * @param {discord.Client} client 
     * @param {*} state 
     * @param {discord.Message} message 
     * @returns 
     */
    async invoke(client, state, message) {
        // ignore bots
        if (!message.author) return;
        if (message.author.bot) return;
        if (message.author.system) return;
        if (message.system) return;

        const prefix = state.prefix;

        const isInTestMode = state.isInTestMode;
        const isTestingInPublic = isInTestMode && !(configuration.servers.testing.includes(message.guildId))

        // ignore #spam
        if (
            message.channel.id === configuration.channels.spam
            || (message.channel.parent && message.channel.parent.id === configuration.channels.spam)
        ) return;
    
        // handle invites
        if (!isTestingInPublic && env.getBool('REPORT_INAPPROPRIATE_INVITES') && DiscordUtility.containsInvite(message.content, { includeShorteners: true })) {
            handleInviteBlock(message);
        }
    
        // handle the case where they are not using a cmd but we can still do stuff
        if (!message.content.startsWith(prefix)) {
            // try ping message
            const canHandlePingMsg = !message.system && message.guild && message.mentions && message.mentions.members;
            if (canHandlePingMsg && !isTestingInPublic) {
                let replyingUser = null;
                if (message.reference && message.reference.messageId) {
                    let replyMessage;
                    try {
                        replyMessage = await message.channel.messages.fetch(message.reference.messageId);
                    } catch {
                        replyMessage = null;
                    }
                    if (replyMessage) {
                        replyingUser = replyMessage.author.id;
                    }
                }
                // if we are in a dm then it doesnt matter & we must actually have mentions stuff
                const didReturnVal = await handlePingMessage(message, replyingUser);
                if (didReturnVal === true) return; // dont check for auto response
            }
    
            // check for stuff we can reply to in a helpful way
            if (env.getBool('RESPOND_TO_KEYWORDS') && !isTestingInPublic) {
                handleBotAutoResponse(message);
            }

            if (!isTestingInPublic && env.getBool("REPORT_AUTOMOD_BYPASS") && DiscordUtility.getPermissionLevel(message) < 2) {
                const automodReportChannel = client.channels.cache.get(configuration.channels.automod);

                // third arg makes it return null on safe and the blcoked word on unsafe
                const messageChecked = message.content;
                const originalAgainstRules = DiscordUtility.automodAllows(messageChecked, false, true);
                const actuallyAgainstRules = DiscordUtility.automodAllows(messageChecked, true, true);
                if (automodReportChannel && (!originalAgainstRules && actuallyAgainstRules)) {
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
            return;
        }
    
        // handle cmds because this is perhaps a command
        // NOTE: Preserving whitespace characters like \n is important
        const messageSlice = message.content.slice(prefix.length);
        const indexOfFirstWhitespace = messageSlice.search(/\s/);
        const commandName = indexOfFirstWhitespace === -1 ? messageSlice : messageSlice.slice(0, indexOfFirstWhitespace);
        const command = state.commands[commandName] || state.alias[commandName];
        if (!command) {
            return message.reply({
                content: `Command not found. Did you mean something else?\nUse \`${prefix}help\` to see a list of commands.`,
                allowedMentions: {
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: true
                }
            });
        }
        
        // create the util for this cmmand, and see if we should block it
        const util = new CommandUtility(command, message);
        if (await util.handleCommandBlock()) return;

        // Only chop off the first whitespace character, then preserve all the rest
        const argumentsString = messageSlice.slice(commandName.length);
        const indexOfFirstNonWhitespace = argumentsString.search(/\S/);
        const textToSplit = (indexOfFirstNonWhitespace === -1 ? argumentsString : argumentsString.slice(indexOfFirstNonWhitespace));
        const split = textToSplit === "" ? [] : textToSplit.split(" ");

        // some commands can allow number conversion
        const convertNums = command.attributes.numberConversion === true;
        const args = convertNums ? split.map(arg => isNaN(Number(arg)) ? String(arg) : Number(arg)) : split;
    
        // use command now
        try {
            await command.invoke(message, args, util);
        } catch (err) {
            console.error(err);
            message.reply({
                content: `An unknown error occurred.\n${err}`.substring(0, 2000),
                allowedMentions: {
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: true
                }
            });
        }
    }
}

module.exports = BotEvent;