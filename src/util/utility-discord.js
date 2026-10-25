const discord = require("discord.js");

const configuration = require("../config");

const env = require('./env-util.js');
const Utility = require("./utility.js");
const makePng = require('./make-png.js');
const tryCatch = require('./try-catch.js');
const BotState = require("./bot-state.js");
const bypass = require("./bypass-characters.js");
const isCompatibleImage = require('./compatible-images.js');

const automodKeywords = tryCatch(() => require('../resources/basic-automod')) || [];

/**
 * @classdesc Meant to be a helper for common discord-related functions.
 */
class DiscordUtility {
    /** @param {discord.Message} message */
    static getPermissionLevel(message) {
        if (message.member.id === env.get('OWNER')) return 3; // owner
        if (message.member.roles.cache.some(role => configuration.permissions.permission3.includes(role.id))) return 3; // developers
        if (message.member.roles.cache.some(role => configuration.permissions.permission2.includes(role.id))) return 2; // mods
        if (message.member.roles.cache.some(role => configuration.permissions.permission1.includes(role.id))) return 1; // bot dev
        return 0;
    }
    /** @param {discord.Message} message */
    static isFromExclusive(message) {
        const isExclusive = message.member.roles.cache.some(role => configuration.permissions.exclusiveRoles.includes(role.id))
            || configuration.permissions.exclusiveUsers.includes(message.author.id);
        return !!isExclusive;
    }
    /** @param {discord.Message} message */
    static isFromEventManager(message) {
        const isEventManager = message.member.roles.cache.some(role => configuration.permissions.eventManagerRoles.includes(role.id));
        return !!isEventManager;
    }

    /** @param {import("discord.js").Message} message  */
    static makeMessageLink(message) {
        return `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`;
    }
    /** @param {import("discord.js").TextChannel} channel  */
    static makeChannelLink(channel) {
        return `https://discord.com/channels/${channel.guildId}/${channel.id}`;
    }

    /**
     * Try as hard as possible to grab a user's avatar. The URL returned may not match the format specified.
     * Dynamic avatars (animated avatars) are only returned if specified, and we can confidently grab one.
     * @param {import("discord.js").GuildMember|import("discord.js").User} user
     * @param {import("discord.js").ImageURLOptions} options 
     * @returns {string}
     */
    static avatarURL(user, options = { format: "png", dynamic: false, size: 256 }) {
        const fallbackUrl = "https://cdn.discordapp.com/embed/avatars/1.png";
        try {
            // if a dynamic avatar is requested, we need to manually check the hash or Discord.js will give us a URL that leads to an error message
            // TODO: When we upgrade to Discord.js v14, consider allowing WEBP here. We dont have any animated WEBP decoders in the bot as of now though, so it's redirected here. 
            if (options.dynamic && options.format === "gif") {
                const avatarHash = user?.avatar;
                const isDynamic = avatarHash?.startsWith?.("a_");
                if (!isDynamic)
                    return this.avatarURL(user, {
                        ...options,
                        dynamic: false,
                        format: "png"
                    });
            } else if (options.dynamic) {
                return this.avatarURL(user, {
                    ...options,
                    dynamic: false
                });
            }

            // try to fallback at all opportunities
            const url = user?.displayAvatarURL?.(options) ?? user?.user?.displayAvatarURL?.(options) ??
                user?.avatarURL?.(options) ?? user?.user?.avatarURL?.(options);
            return url || fallbackUrl;
        } catch {
            return fallbackUrl;
        }
    }

    /**
     * Get the message that this message is replying to
     * @param {import("discord.js").Message} message
     * @returns {Promise<import("discord.js").Message?>}
     */
    static getReply(message) {
        return new Promise((resolve) => {
            if (!(message.reference && message.reference.messageId)) {
                resolve(undefined);
                return;
            }
            const reply = message.reference.messageId;
            message.channel.messages.fetch(reply).then(repliedMessage => {
                resolve(repliedMessage);
            }).catch(() => {
                resolve(undefined);
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
            if ((reply && reply.attachments.size > 0) && (reply.author.id === message.author.id || !Utility.interactionsBlocked(reply.author.id))) {
                attachments.push(...reply.attachments.values());
            } else {
                // block if the user doesnt have interaftions
                if (Utility.interactionsBlocked(mention) && mention.id !== message.author.id) {
                    if (allowBlocking) {
                        message.reply('The user you mentioned has interactions disabled.');
                        return [false];
                    }
                    return [];
                } else {
                    // get the PFP of the mentioned user, or the author
                    // NOTE: Discord.js v13 either has some weird quirk with dynamic avatars or the api is just really weird.
                    // Either way, we aren't going to request GIF avatars from discord because the api returns a silent error message
                    // when the user doesn't have an animated avatar and we try to request one anyways.
                    const options = { format: "png", size: 256 };
                    const imageUrl = mention ? mention.displayAvatarURL(options)
                        : (message.member?.avatarURL(options) || message.author.displayAvatarURL(options));
                    
                    // copying fetching here is kinda bad, but i'd rather have this than weird loop over to reuse the attachments code
                    const attachmentFetch = await fetch(imageUrl);
                    const attachmentArrayBuffer = await attachmentFetch.arrayBuffer();
                    const attachmentBuffer = Buffer.from(attachmentArrayBuffer);
                    return [await makePng(attachmentBuffer)];
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
    /**
     * Resolves a mention like <@id> or a user ID into a User
     * @param {string} wrappedId <@id> or id
     * @returns {Promise<discord.User?>}
     */
    static async resolveMention(userIdOrWrapped) {
        userIdOrWrapped = String(userIdOrWrapped).trim();
        if (userIdOrWrapped.startsWith('<@') && userIdOrWrapped.endsWith('>')) {
            userIdOrWrapped = userIdOrWrapped.substring(2, userIdOrWrapped.length - 1);
        }

        if (!userIdOrWrapped) return;
        if (userIdOrWrapped === "0") return;
        if (userIdOrWrapped === "NaN") return;
        
        // NOTE: Discord IDs cant be represented in a number but they should still be a valid number
        if (isNaN(Number(userIdOrWrapped)))
            return;

        try {
            return await BotState.client.users.fetch(userIdOrWrapped);
        } catch {
            return;
        }
    }
    /**
     * Resolves a Discord or Unicode emoji's information if valid.
     * Discord emojis will be animated or static with an ID, and Unicode emojis will not have an ID but are returned in `emoji`.
     * @param {string} emoji Emoji 
     * @returns {{ type:"animated"|"static"|"unicode", emoji:string?, id:string? }|null} Emoji information if available
     */
    static resolveEmoji(emoji) {
        if (!emoji) return;
        const customMatch = emoji.match(/<(a|):[a-z0-9_\-]+:(\d+)>/i) || emoji.match(/^(\d+)$/);
        if (customMatch) {
            const id = customMatch[2] || customMatch[1];
            const emojiData = BotState.client.emojis.cache.get(id);
            if (!emojiData) return null;

            return {
                type: emojiData.animated ? "animated" : "static",
                emoji: null,
                id: emojiData.id
            };
        }

        const unicodeRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/;
        if (unicodeRegex.test(emoji)) {
            return {
                type: "unicode",
                emoji: emoji,
                id: null
            };
        }

        return null;
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
}

module.exports = DiscordUtility;
