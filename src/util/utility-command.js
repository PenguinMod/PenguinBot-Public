const discord = require("discord.js");

const configuration = require("../config.js");

const env = require("./env-util.js");
const Utility = require("./utility.js");
const BotState = require("./bot-state.js");
const DiscordUtility = require("./utility-discord.js");

/**
 * Utilities related to the current command.
 * Instances of this utility are made for each command run.
 */
class CommandUtility {
    /**
     * @param {*} command The command that this utility is attached to.
     * @param {discord.Message} message The message that this utility is attached to.
     */
    constructor(command, message) {
        /**
         * The command that this utility is attached to.
         * @type {*}
         */
        this.command = command;

        /**
         * The message that this utility is attached to.
         * @type {discord.Message}
         */
        this.message = message;

        /**
         * The Discord client for convenience
         * @type {discord.Client}
         */
        this.client = BotState.client;
    }

    /**
     * The commands registered in the bot as of now.
     * @type {object}
     */
    get commands() {
        return BotState.request("commands");
    }
    /**
     * Aliases for commands registered in the bot as of now.
     * @type {object}
     */
    get alias() {
        return BotState.request("alias");
    }
    /**
     * The current prefix of the bot.
     * @type {string}
     */
    get prefix() {
        return BotState.request("prefix");
    }

    getPermissionLevel(message = this.message) {
        return DiscordUtility.getPermissionLevel(message);
    }
    isFromExclusive(message = this.message) {
        return DiscordUtility.isFromExclusive(message);
    }
    isFromEventManager(message = this.message) {
        return DiscordUtility.isFromEventManager(message);
    }

    /** @param {import("discord.js").Message} message  */
    makeMessageLink(message = this.message) {
        return DiscordUtility.makeMessageLink(message);
    }
    /** @param {import("discord.js").TextChannel} channel  */
    makeChannelLink(channel = this.message.channel) {
        return DiscordUtility.makeChannelLink(channel);
    }

    /**
     * Try as hard as possible to grab the user's avatar. The URL returned may not match the format specified.
     * Dynamic avatars (animated avatars) are only returned if specified, and we can confidently grab one.
     * @param {import("discord.js").ImageURLOptions} options 
     */
    avatarURL(options) {
        return DiscordUtility.avatarURL(this.message.member || this.message.author, options);
    }

    /**
     * Get the message that this message is replying to
     * @param {import("discord.js").Message} message
     * @returns {Promise<import("discord.js").Message?>}
     */
    async getReply(message = this.message) {
        return await DiscordUtility.getReply(message);
    }
    /**
     * Gets the input image for a command and converts it to PNG if necessary.
     * @param {number} [amount=1] The amoount of images to fetch. Note that more images *can* be added to the command, they will just be ignored if this isnt increased.
     * @param {boolean?} allowGif `true` = keep gifs as gifs, `false` or default = convert gifs to png. If true, then only supporters can use `.gif` files. `false` by default
     * @param {boolean?} allowBlocking Replies to the message if input is invalid or failed. If this is used, then imageBuffer === false  means the message was replied to with an error. `true` by default
     * @returns {Buffer[]} at least 1 image buffer
     */
    async getInputImagesForCommand(amount = 1, allowGif = false, allowBlocking = true) {
        return await DiscordUtility.getInputImagesForCommand(this.message, amount, allowGif, allowBlocking);
    }

    /**
     * Check if this message is sent by someone who can interact with the specified user
     * @param {string|discord.User} userOrId 
     * @returns {boolean}
     */
    canInteract(userOrId) {
        // NOTE: This is the inverse of interactionsBlocked so return true if userOrId is meaningless
        if (!userOrId)
            return true;

        // get the actual ID to target
        const id = typeof userOrId !== 'string' ? userOrId.id : userOrId;
        if (!id || typeof id !== 'string')
            return true;

        // users can interact with themselves regardless
        if (id === this.message.author.id)
            return true;

        // otherwise, check if they have interactions blocked
        return !Utility.interactionsBlocked(id); 
    }

    // command rejecting
    /** @private */
    async _commandBlockReject(reason) {
        if (typeof this.command.reject === "function")
            await this.command.reject(this.message, reason, this);
        return true;
    }
    /** @private */
    _inclusiveAllowsUser(userId, userRoles, requiredRoles) {
        const containsUser = requiredRoles.includes(userId);
        if (containsUser) return true;
        for (const userRole of userRoles) {
            if (requiredRoles.includes(userRole)) return true;
        }
        return false;
    }
    /**
     * Generic "cannot use this command" handler for use by text + slash commands. Returns true on blocked message.
     * Runs command.reject on block if available, otherwise runs message.reply
     * @returns {boolean} Whether or not the command was blocked.
     */
    async handleCommandBlock() {
        // NOTE: This is structured for higher priority checks first
        // if user's permission is less than required permission
        const permission = this.command.attributes.permission || 0;
        const userPermission = this.getPermissionLevel();
        if (userPermission < permission) {
            // if permission inclusive allows them to use the command anyway, then dont return blocked
            const allowedAnyway = this.command.attributes.permissionInclusive
                && this._inclusiveAllowsUser(this.message.author.id, this.message.member.roles.cache.map(role => role.id), this.command.attributes.permissionInclusive);
            if (!allowedAnyway)
                return await this._commandBlockReject(`You need a permission level of ${permission} to run this command, yours is currently ${userPermission}.`);
        }
        // if the command is for specific roles
        const insideMainServer = (this.message.guild && (configuration.servers.production.includes(this.message.guildId)
            || (configuration.servers.testing.includes(this.message.guildId))));
        if (this.command.attributes.exclusive === true
            || this.command.attributes.eventManagers === true) {
            // supporters; if the user is outside of our target server, then they need to be explicitly defined in exclusiveUsers
            const shouldAllowNonSupporter = (insideMainServer && this.isFromExclusive())
                || (this.command.attributes.exclusiveInclusive && this._inclusiveAllowsUser(this.message.author.id, this.message.member.roles.cache.map(role => role.id), this.command.attributes.exclusiveInclusive));
            const shouldAllowNonEventManager = (insideMainServer && this.isFromEventManager());
            if (this.command.attributes.exclusive === true && (!shouldAllowNonSupporter))
                return await this._commandBlockReject("Only supporters & server boosters can run this command.");
            if (this.command.attributes.eventManagers === true && (!shouldAllowNonEventManager))
                return await this._commandBlockReject("Only event managers can run this command.");
        }
        // if the command is locked to certain channels
        // TODO: This shouldnt matter for most slash commands. The only problem is that slash commands should always be ephemeral replies if done outside of the channel
        if (this.command.attributes.lockedToChannels
            || this.command.attributes.lockedToHelp
            || this.command.attributes.lockedToCommands
            || this.command.attributes.spaceOwner) {
            // NOTE: Users above perm 3 can bypass commands specifically locked to #commands
            // NOTE: insideUnlockedChannel is only really compatible with lockedToChannels and may be more/less restrictive than expected on other gates
            const insideUnlockedChannel = this.command.attributes.unlockedChannels
                && (this.command.attributes.unlockedChannels.includes(this.message.channel.id)
                    || this.command.attributes.unlockedChannels.includes(this.message.channel.parentId));

            const hasPermissionBypass = this.command.attributes.lockedToCommands && userPermission >= 3;
            const allowedToBypass = insideUnlockedChannel || hasPermissionBypass;

            // #spaces commands
            if (this.command.attributes.spaceOwner) {
                const insideSpacesChannel = insideMainServer && this.message.channel.parentId === configuration.channels.spaces;
                const spaceIsOwnedByUser = insideSpacesChannel && this.message.channel.ownerId === this.message.author.id;
                if (!spaceIsOwnedByUser && !allowedToBypass)
                    return await this._commandBlockReject(`This command can only be used in <#${configuration.channels.spaces}> that you have created.`);
            }

            const isHelpChannel = this.message.channel.parentId === configuration.channels.help;
            const isCommandsChannel = this.message.channel.id === configuration.channels.commands
                || this.message.channel.parentId === configuration.channels.commands
                || this.message.channel.id === configuration.channels.commandsDev
                || this.message.channel.parentId === configuration.channels.commandsDev
                || configuration.permissions.lockedToCommands.includes(this.message.channel.id);
            const isBeingRanOutsideOfSpecificChannels = this.command.attributes.lockedToChannels
                && !this.command.attributes.lockedToChannels.includes(this.message.channel.id);
            if (!allowedToBypass) {
                if (isBeingRanOutsideOfSpecificChannels)
                    return await this._commandBlockReject(`This command can only be used in certain channels. See \`${BotState.request("prefix")}help ${this.command.name}\` for info.`);
                if (this.command.attributes.lockedToHelp && (!isHelpChannel))
                    return await this._commandBlockReject(`This command can only be used in <#${configuration.channels.help}>.`);
                // NOTE: We dont care about restricting commands channels for servers other than our server
                if (this.command.attributes.lockedToCommands && (insideMainServer && !isCommandsChannel))
                    return await this._commandBlockReject(`This command can only be used in the commands channel.`);
            }
        }

        // all checks passed so we're allowed to use this command
        return false;
    }
}

module.exports = CommandUtility;
