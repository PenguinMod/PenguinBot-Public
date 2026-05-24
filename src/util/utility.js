const discord = require("discord.js");
const Database = require('sync-json-database');
const DisabledInteractionsDB = new Database('./databases/disabled-interactions.json');

const configuration = require("../config");

const env = require('./env-util');
const makePng = require('./make-png');
const tryCatch = require('./try-catch');
const bypass = require("./bypass-characters");
const isCompatibleImage = require('./compatible-images');

const automodKeywords = tryCatch(() => require('../resources/basic_automod')) || [];

/**
 * @classdesc Meant to be a helper for common discord-related functions.
 * state is also included as it contains global info about the discord bot.
 */
class CommandUtility {
    static state = {};
    static client = null;

    // used as a cleaner way to access values in the main bot process
    static request(value) {
        return this.state[value];
    }

    static getPermissionLevel(message) {
        if (message.member.id === env.get('OWNER')) return 3; // owner
        if (message.member._roles.some(v => configuration.permissions.permission3.includes(v))) return 3; // developers
        if (message.member._roles.some(v => configuration.permissions.permission2.includes(v))) return 2; // mods
        if (message.member._roles.some(v => configuration.permissions.permission1.includes(v))) return 1; // bot dev
        return 0;
    }
    static isFromExclusive(message) {
        const isExclusive = message.member._roles.some(v => configuration.permissions.exclusiveRoles.includes(v));
        return isExclusive;
    }

    /** @param {import("discord.js").Message} message  */
    static makeMessageLink(message) {
        return `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`;
    }
    /** @param {import("discord.js").TextChannel} channel  */
    static makeChannelLink(channel) {
        return `https://discord.com/channels/${channel.guildId}/${channel.id}`;
    }

    /** @returns {Promise<import("discord.js").Message?>} */
    static getReply(message) {
        return new Promise((resolve) => {
            if (!(message.reference && message.reference.messageId)) {
                resolve(undefined);
                return;
            }
            const reply = message.reference.messageId;
            message.channel.messages.fetch(reply).then(repliedMessage => {
                resolve(repliedMessage);
            });
        });
    }
    static getAttachmentType(attachment) {
        try {
            return attachment.contentType.split(';')[0].split('/')[1];
        } catch {
            return;
        }
    };
    /**
     * Gets the input image for a command and converts it to PNG if necessary.
     * @param {discord.Message} message the message to get input image from (likely the message with the command)
     * @param {number} [amount=1] The amoount of images to fetch. Note that more images *can* be added to the command, they will just be ignored if this isnt increased.
     * @param {boolean?} allowGif `true` = keep gifs as gifs, `false` or default = convert gifs to png. If true, then only supporters can use `.gif` files. `false` by default
     * @param {boolean?} allowBlocking Replies to the message if input is invalid or failed. If this is used, then imageBuffer === false  means the message was replied to with an error. `true` by default
     * @returns {Buffer[]} at least 1 image buffer
     */
    static async getInputImagesForCommand(message, amount = 1, allowGif = false, allowBlocking = true) {
        const isDonator = this.isFromExclusive(message);

        // priority:
        // - Provided images
        // - if not, then replied message images
        // - if not, then mentioned user pfp
        // - if not, then replied user pfp
        // - if not, then current user pfp
        // we do NOT stack provided images with replied user images, provided image with replied user pfp, etc.
        const attachments = [];
        if (message.attachments.size > 0) {
            attachments.push(...message.attachments.values());
        } else {
            // Check if a user is mentioned in the args, or it's a reply to a user.
            // Replies are mentions if the reply has no attachments.
            let mention = message.mentions.users.first();
            const reply = await this.getReply(message);
            if ((reply && reply.attachments.size <= 0) && !mention) {
                mention = reply.author;
            }
            
            // If we can use the reply's attachments, then use them and dont use the PFP
            // Otherwise get the PFP of the mentioned/replied user || the message author
            if ((reply && reply.attachments.size > 0) && (reply.author.id === message.author.id || !this.interactionsBlocked(reply.author.id))) {
                attachments.push(...reply.attachments.values());
            } else {
                // block if the user doesnt have interaftions
                if (this.interactionsBlocked(mention) && mention.id !== message.author.id) {
                    if (allowBlocking) {
                        message.reply('The user you mentioned has interactions disabled.');
                        return [false];
                    }
                    return [];
                } else {
                    // get the PFP of the mentioned user, or the author
                    const requestGif = isDonator && allowGif;
                    const options = { format: !requestGif ? "png" : "gif", size: 256, dynamic: requestGif };
                    const imageUrl = mention ? mention.displayAvatarURL(options)
                        : (message.member?.avatarURL(options) || message.author.displayAvatarURL(options));
                    
                    // copying fetching here is kinda bad, but i'd rather have this than weird loop over to reuse the attachments code
                    const attachmentFetch = await fetch(imageUrl);
                    const attachmentArrayBuffer = await attachmentFetch.arrayBuffer();
                    const attachmentBuffer = Buffer.from(attachmentArrayBuffer);
                    return [requestGif ? attachmentBuffer : (await makePng(attachmentBuffer))];
                }
            }
        }

        // get image urls from the attachments
        // the attachments will either be off of the current message OR a replied message
        if (attachments.length <= 0) {
            if (allowBlocking) {
                if (allowGif) {
                    message.reply(`Please use a valid image format.\nSupporters can use \`.gif\` images with this command.`);
                } else {
                    message.reply("Please use a valid image format.");
                }
                return [false];
            }
            return [];
        }

        /** @type {[imageUrl:string, usingGif:boolean]} */
        const imageUrls = [];
        attachments.splice(amount, Infinity); // dont fetch more than max by cutting out everything after amount (after the first image by default)
        for (const attachment of attachments) {
            // check the file type
            const imageUrl = attachment.url;
            const imageType = this.getAttachmentType(attachment);
            const usingGif = imageType === "gif";
            if ((!isCompatibleImage(imageType)) || (usingGif && !isDonator)) {
                if (allowBlocking) {
                    if (allowGif) {
                        message.reply(`Please use a valid image format.\nSupporters can use \`.gif\` images with this command.`);
                    } else {
                        message.reply("Please use a valid image format.");
                    }
                    return [false];
                }
                return [];
            }

            // file size limits
            if (!isDonator && attachment.size > 512000) {
                if (allowBlocking) {
                    message.reply("Non-supporters or server boosters must use images below 512 KB.\nTry [resizing your image.](<https://ezgif.com/resize>)");
                    return [false];
                }
                return [];
            }
            // supporter file size limits
            if (isDonator && !usingGif && attachment.size > 2e+6) {
                if (allowBlocking) {
                    message.reply("Images must be below 2 MB.\nTry [resizing your image.](<https://ezgif.com/resize>)");
                    return [false];
                }
                return [];
            }
            if (isDonator && usingGif && attachment.size > 5e+6) {
                if (allowBlocking) {
                    message.reply("GIFs must be below 5 MB.\nTry [resizing your gif](<https://ezgif.com/resize>) or [optimizing it.](<https://ezgif.com/optimize>)");
                    return [false];
                }
                return [];
            }

            imageUrls.push([imageUrl, usingGif]);
        }

        // now that we confirmed we can actually use all imageUrls, then fetch
        const buffers = [];
        for (const [imageUrl, usingGif] of imageUrls) {
            const attachmentFetch = await fetch(imageUrl);
            const attachmentArrayBuffer = await attachmentFetch.arrayBuffer();
            const attachmentBuffer = Buffer.from(attachmentArrayBuffer);
            buffers.push((usingGif && allowGif) ? attachmentBuffer : (await makePng(attachmentBuffer)));
        }
        return buffers;
    }

    /** @param {import("discord.js").MessageReaction} reaction  */
    static async getReactingUsers(reaction) {
        const maxLimit = 100;

        let allUsers = [];
        let lastId = null;
        if (reaction.partial) await reaction.fetch();
        while (true) {
            const users = await reaction.users.fetch({ limit: maxLimit, after: lastId });
            if (users.size === 0) return allUsers;

            const lastUser = users.last();
            allUsers.push(...Array.from(users.values())); // NOTE: this is kinda stinky i dont like it
            lastId = lastUser.id;

            if (users.size < maxLimit)
                return allUsers;
        }
    }

    static interactionsBlocked(userOrId) {
        if (!userOrId) return false;
        let id = userOrId;
        if (typeof id !== 'string') {
            id = userOrId.id;
        }
        if (!id || typeof id !== 'string') return false;
        const isBlocked = DisabledInteractionsDB.get(id);
        return isBlocked === true;
    }

    static automodAllows(text, optCheckBypass, optReturnWord) {
        text = String(text)
            .toLowerCase()
            .replaceAll(' ', '')
            .replaceAll('\n', '')
            .replaceAll('\r', '');

        if (optCheckBypass) {
            text = text.split("").map(bypass.getRealCharacter).join("");
        }

        for (const keyword of automodKeywords) {
            if (text.includes(keyword)) {
                if (optReturnWord) {
                    return keyword;
                }
                return false;
            }
        }

        if (optReturnWord) {
            return;
        }
        return true;
    }

    static extractInviteShorteners(messageContent = '') {
        // this only matches invite shorteners, not discord.com, discord.gg, etc
        const shortenerRegex = /(https?:\/\/)(www\.)?(r\.)?(dsc\.gg\/?|dsc\.com\/invite)\/[^\s\/]+/gmi;

        const matches = messageContent.match(shortenerRegex);
        return matches || []; // no matches will return null
    }
    static containsInviteShorteners(messageContent = '') {
        const shorteners = this.extractInviteShorteners(messageContent);
        return shorteners.length > 0;
    }
    static extractInvites(messageContent = '', options = {
        includeShorteners: false,
        inviteCodes: false,
    }) {
        // includeShorteners will use shortenerRegex, which also matches dsc.gg and r.dsc.gg
        const nonShortenerRegex = /(https?:\/\/)?(www\.)?((discord\.(gg|io|me|li))|((discordapp|discord)\.com\/invite))(\/invite|)\/[^\s\/]+/gmi;
        const shortenerRegex = /(https?:\/\/)?(www\.)?(((r\.|)(discord|dsc)\.(gg|io|me|li))|((discordapp|discord|dsc)\.com\/invite))(\/invite|)\/[^\s\/]+/gmi;

        // no matches will return null
        const matches = messageContent.match(options.includeShorteners ? shortenerRegex : nonShortenerRegex) || [];
        return options.inviteCodes ? matches.map(url => url.split('/').pop()) : matches;
    }
    static containsInvite(messageContent = '', options = { includeShorteners: false }) {
        const invites = this.extractInvites(messageContent, options);
        return invites.length > 0;
    }

    static _commandBlockReject(command, message, split, reason) {
        if (typeof command.reject === "function") {
            command.reject(message, split, this);
        } else {
            message.reply(reason);
        }
    }
    static _inclusiveAllowsUser(userId, userRoles, requiredRoles) {
        const containsUser = requiredRoles.includes(userId);
        if (containsUser) return true;
        for (const userRole of userRoles) {
            if (requiredRoles.includes(userRole)) return true;
        }
        return false;
    }

    // Generic "cannot use this command" handler for use by text + slash commands. Returns true on blocked message.
    static handleCommandBlock(command, message, split) {
        let permission = command.attributes.permission;
        if (permission === undefined) {
            permission = 0;
            if (command.attributes.admin === true) permission = 3;
        }
        if (this.getPermissionLevel(message) < permission) {
            if (command.attributes.adminInclusive && this._inclusiveAllowsUser(message.author.id, message.member._roles, command.attributes.adminInclusive)) return;
            this._commandBlockReject(command, message, split, `You need a permission level of ${permission} to run this command, yours is currently ${this.getPermissionLevel(message)}.`);
            return true;
        }
        if (command.attributes.exclusive === true) {
            let canBeUsed = configuration.permissions.exclusiveUsers.includes(message.author.id);
            if (message.guild && message.guild.id === env.get("SERVER_ID")) {
                canBeUsed = canBeUsed || this.isFromExclusive(message);
            }
            // lmao
            if (command.attributes.exclusiveInclusive) {
                canBeUsed = canBeUsed || this._inclusiveAllowsUser(message.author.id, message.member._roles, command.attributes.exclusiveInclusive);
            }
            if (!canBeUsed) {
                this._commandBlockReject(command, message, split, "Only supporters & server boosters can run this command.");
                return true;
            }
        }
        if (Array.isArray(command.attributes.lockedToChannels) && this.getPermissionLevel(message) < 3) {
            // check which channel we are in
            const lockedChannels = command.attributes.lockedToChannels;
            const canBeUsed = lockedChannels.includes(message.channel.id);
            if (!canBeUsed) {
                this._commandBlockReject(command, message, split, `This command can only be used in these channels: ${lockedChannels.map(id => `<#${id}>`).join(', ')}`);
                return true;
            }
        }
        if (command.attributes.lockedToCommands === true && this.getPermissionLevel(message) < 3) {
            // check which channel we are in
            let canBeUsed = true;
            if (message.guild && (message.guild.id === env.get("SERVER_ID")
                || (env.getBool("CHECK_FOR_DEFAULT_TEST_SERVERS") && message.guild.id === "746156168560508950"))) { // i have a test server so
                canBeUsed = message.channel.id === configuration.channels.commands // commands
                    || message.channel.parentId === configuration.channels.commands // in a thread in commands
                    || message.channel.id === configuration.channels.commandsDev // dev-commands
                    || message.channel.parentId === configuration.channels.commandsDev // in a thread in dev-commands
                    || configuration.permissions.lockedToCommands.includes(message.channel.id);
                if (command.attributes.unlockedChannels) {
                    // there are other conditions here
                    canBeUsed = canBeUsed
                        || command.attributes.unlockedChannels.includes(message.channel.id)
                        || command.attributes.unlockedChannels.includes(message.channel.parentId);
                }
            }
            if (!canBeUsed) {
                this._commandBlockReject(command, message, split, `This command can only be used in <#${configuration.channels.commands}>.`);
                return true;
            }
        }
        if (command.attributes.lockedToHelp) {
            // check which channel we are in
            let canBeUsed = true;
            if (message.guild && (message.guild.id === env.get("SERVER_ID")
                || (env.getBool("CHECK_FOR_DEFAULT_TEST_SERVERS") && message.guild.id === "746156168560508950"))) {
                canBeUsed = message.channel.parent.id === configuration.channels.help // help
                    || message.channel.id === configuration.channels.botTestingChannel; // penguinbot-test
                if (command.attributes.unlockedChannels) {
                    // there are other conditions here
                    canBeUsed = canBeUsed
                        || command.attributes.unlockedChannels.includes(message.channel.id)
                        || command.attributes.unlockedChannels.includes(message.channel.parent.id);
                }
            }
            if (!canBeUsed) {
                this._commandBlockReject(command, message, split, `This command can only be used in <#${configuration.channels.help}>.`);
                return true;
            }
        }
        if (command.attributes.spaceOwner === true) {
            // this command is locked to #spaces forum & the post's owner
            let canBeUsed = false;
            if (
                message.channel.parentId === configuration.channels.spaces
                && message.channel.ownerId === message.author.id
            ) {
                canBeUsed = true;
            }
            if (!canBeUsed) {
                this._commandBlockReject(command, message, split, `This command can only be used in <#${configuration.channels.spaces}> that you have created.`);
                return true;
            }
        }
        return false;
    }
}

module.exports = CommandUtility;
