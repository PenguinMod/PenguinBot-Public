// TODO: Deprecate this and replace it with jwklong's slash command arguments system from the scrapped bot rewrite (that would also resolve the todo for making slash commands first over text commands)
/**
 * Types of slash command options
 * @enum {Number}
 */
const OptionType = {
    /**
     * Subcommand
     */
    SUB_COMMAND: 1,

    /**
     * Group of subcommands
     */
    SUB_COMMAND_GROUP: 2,

    /**
     * Text value
     */
    STRING: 3,

    /**
     * Any integer between -2^53 and 2^53
     */
    INTEGER: 4,

    /**
     * true or false value
     */
    BOOLEAN: 5,

    /**
     * Mentionable user
     */
    USER: 6,

    /**
     * Includes all channel types + categories
     */
    CHANNEL: 7,

    /**
     * Mentionable role
     */
    ROLE: 8,

    /**
     * Includes users and roles
     */
    MENTIONABLE: 9,

    /**
     * Any double between -2^53 and 2^53
     */
    NUMBER: 10,

    /**
     * attachment object
     */
    ATTACHMENT: 11,
};

module.exports = OptionType;