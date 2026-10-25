const discord = require("discord.js");

const BotState = require("../util/bot-state.js");
const OptionType = require('../util/optiontype.js');

class BaseCommand {
    /**
     * The singular instance of the command
     * @type {BaseCommand}
     */
    static instance = null;

    /**
     * Represents a command for the Discord bot.
     */
    constructor() {
        /**
         * The name of the command
         * @type {string}
         */
        this.name = "base";
        /**
         * The description of the command
         * @type {string}
         */
        this.description = "Description";
        /**
         * Attributes that define this command.
         * @type {object}
         */
        this.attributes = {
            unlisted: false,
            permission: 0
        };

        /**
         * The Discord client that holds this command.
         * @type {import("discord.js").Client}
         */
        this.client = BotState.client;

        // save the singular instance in static so we can import commands into other commands by file
        this.constructor.instance = this;
    }

    /**
     * Runs when the command is ran, but doesn't get invoked because the user is: missing permissions, in the wrong channel, etc.
     * @param {import("discord.js").Message} message 
     * @param {string} reason A human-readable reason why the command invoke was rejected
     * @param {import("../util/utility-command.js")} util 
     * @returns {void}
     */
    reject(message, reason, util) {
        return message.reply({
            content: reason.substring(0, 2000),
            flags: discord.MessageFlags.FLAGS.SUPPRESS_EMBEDS,
            allowedMentions: {
                parse: [],
                users: [],
                roles: [],
                repliedUser: true,
            }
        }).catch(() => {});
    }

    /**
     * Runs when the command is called
     * @param {import("discord.js").Message} message 
     * @param {string[]} args 
     * @param {import("../util/utility-command.js")} util 
     * @returns {Promise<any>}
     */
    async invoke(message, args, util) {
        return; // should be overridden
    }
}

module.exports = BaseCommand;
