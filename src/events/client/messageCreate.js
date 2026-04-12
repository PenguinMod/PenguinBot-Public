const discord = require("discord.js");
const CommandUtility = require("../../util/utility.js");

const handleInviteBlock = require('../../util/inviteblock.js');
const handlePingMessage = require('../../util/pingmessage.js');
const handleBotAutoResponse = require('../../resources/responses/index.js');
const configuration = require("../../config");
const env = require("../../util/env-util");

const isInTestMode = process.argv[2] === 'test';
const prefix = isInTestMode ? env.get("PREFIX_TEST") : env.get("PREFIX");

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

        const isTestingInPublic = isInTestMode && !(env.getBool("CHECK_FOR_DEFAULT_TEST_SERVERS") && message.guildId === "746156168560508950")

        // ignore #spam
        if (
            message.channel.id === configuration.channels.spam
            || (message.channel.parent && message.channel.parent.id === configuration.channels.spam)
        ) return;
    
        // handle invites
        if (!isTestingInPublic && CommandUtility.containsInvite(message.content, {
            includeShorteners: true
        })) {
            handleInviteBlock(message, client, CommandUtility);
        }

        CommandUtility.state = state;
    
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

            // TODO: Add config for this feature + config to make it block the message if its bypassed
            if (!isTestingInPublic && CommandUtility.getPermissionLevel(message) < 2) {
                const automodReportChannel = client.channels.cache.get(configuration.channels.automod);

                // third arg makes it return null on safe and the blcoked word on unsafe
                const messageChecked = message.content;
                const originalAgainstRules = CommandUtility.automodAllows(messageChecked, false, true);
                const actuallyAgainstRules = CommandUtility.automodAllows(messageChecked, true, true);
                if (automodReportChannel && (!originalAgainstRules && actuallyAgainstRules)) {
                    // automod was bypassed for this message
                    const embed = new discord.MessageEmbed();
                    embed.setTitle("AutoMod Bypassed");
                    embed.setAuthor({
                        name: message.author.displayName || message.author.username,
                        iconURL: message.author.avatarURL({ format: "png" }),
                    });
                    embed.setDescription(messageChecked);
                    embed.addFields([
                        {
                            name: "Keyword",
                            value: actuallyAgainstRules
                        },
                        {
                            name: "Jump to Message",
                            value: CommandUtility.makeMessageLink(message),
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
    
        // handle cmds
        // this is perhaps a command
        const split = message.content.split(' ');
        split[0] = split[0].replace(prefix, '');
        if (!(split[0] in state.commands)) {
            message.reply({
                content: `Command not found. Did you mean something else?\nUse \`${prefix}help\` to see a list of commands.`,
                allowedMentions: {
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: true
                }
            });
            return;
        }
    
        const commandName = split[0];
        const command = state.commands[commandName];
    
        const isBlocked = CommandUtility.handleCommandBlock(command, message, split);
        if (isBlocked) return;
    
        // remove the command name argument
        split.shift();

        // some commands can allow number conversion
        const convertNums = command.attributes.numberConversion === true;
        const args = convertNums ? split.map(argument => {
            if (isNaN(Number(argument))) {
                return String(argument);
            }
            return Number(argument);
        }) : split;
    
        // use command now
        try {
            /* client is passed so the command can send messages in arbitrary channels */
            await command.invoke(message, args, CommandUtility, client);
        } catch (err) {
            console.error(err);
            message.reply({
                content: `An unknown error occurred.\n${err}`,
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