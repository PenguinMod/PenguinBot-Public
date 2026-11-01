const discord = require("discord.js");

/**
 * Access globals about the bot in here.
 */
class BotState {
    /**
     * Whether or not index.js filled out BotState properly.
     * Should always be true unless an external script is using BotState for whatever reason.
     */
    static active = false;
    /**
     * Only true when all events and commands have initialized.
     * Use BotEventEmitter.ready() to wait for this.
     */
    static initialized = false;
    /**
     * Only true when all events have initialized.
     */
    static initializedEvents = false;
    /**
     * Whether or not we've entered graceful shutdown
     */
    static shuttingDown = false;

    /** @type {discord.Client} */
    static client = null;
    /** The HTTP server when a web panel is running. @type {import("http").Server} */
    static server = null;
    /** Arbitrary values like serialized data and flags. */
    static state = {};

    /** If set, then this denotes that we have errors/warnings to display to users afterSetup. @type {string?} */
    static afterSetupNote = null;

    /**
     * used as a cleaner way to access values in the main bot process
     * @param {string} value
     */
    static request(value) {
        return this.state[value];
    }
    /**
     * persist something in state.serialized
     * @param {string} key
     * @param {any} value JSON serializable value
     */
    static persist(key, value) {
        if (!this.active)
            return;
        this.state.serialized[key] = value;
    }
}

module.exports = BotState;
