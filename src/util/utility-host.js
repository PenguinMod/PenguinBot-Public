const Database = require('sync-json-database');
const LastState = new Database('./databases/last-state.json', { indented: true });

const BotState = require("./bot-state.js");

/**
 * Utilities related to the bot host / process
 */
class HostUtility {
    // NOTE: A lot of functions are async for future extendability, despite using sync-json-database
    /**
     * Essentially the Date.now() when index.js was started.
     */
    static startMilliseconds = Date.now(); // overridden by index.js
    /**
     * Points to the first argument provided when launching index.js
     * Only the specified values are expected to be used here.
     * @type {"production"|"test"}
     */
    static launchMode = process.argv[2] || "production";

    /** @param {NodeJS.Platform} platform */
    static getPlatformEmoji(platform = process.platform) {
        switch (platform) {
            case 'win32':
                return '🪟';
            case 'darwin':
                return '🍎';
            case 'linux':
                return '🐧';
            case 'freebsd':
                return '👹';
            case 'openbsd':
                return '🐡';
            case 'aix':
                return '🔷';
            case 'sunos':
                return '☀️';
            case "android":
                return '🤖';
            case "cygwin":
                return '🔧';
            case "haiku":
                return '🍃';
            case "netbsd":
                return '🚩';
            default:
                return '💻';
        }
    }
    /** @param {NodeJS.Platform} platform */
    static getPlatformName(platform = process.platform) {
        switch (platform) {
            case 'win32':
                return 'Windows';
            case 'darwin':
                return 'Darwin';
            case 'linux':
                return 'Linux';
            case 'freebsd':
                return 'FreeBSD';
            case 'openbsd':
                return 'OpenBSD';
            case 'aix':
                return 'AIX';
            case 'sunos':
                return 'SunOS';
            case "android":
                return 'Android';
            case "cygwin":
                return 'Cygwin';
            case "haiku":
                return 'Haiku';
            case "netbsd":
                return 'NetBSD';
            default:
                return typeof platform === "string" ? platform : "(unspecified)";
        }
    }

    /**
     * @typedef {object} LastState
     * @property {boolean} created Whether or not an old state existed. This will likely always be true.
     * @property {number} started When the bot started.
     * @property {number} written When this state was last written to disk.
     * @property {number} time When the status was last changed.
     * @property {"active"|"restart"|"shutdown"|"abort"} status If/how we planned to exit the bot when this state was being written.
     * @property {string?} error The error if the last status was an abort
     * @property {object} serialized Any arbitrary serialized data
     */
    /**
     * The state that was saved when the last bot process stopped (ie, before restarting the bot)
     * @type {LastState}
     */
    static lastState = {}; // overridden by index.js

    /**
     * Save the latest bot state to disk
     */
    static async saveLastState() {
        LastState.setLocal("created", true);
        LastState.setLocal("serialized", BotState.request("serialized") || {});
        LastState.setLocal("started", this.startMilliseconds);
        LastState.setLocal("written", Date.now());
        LastState.saveDataToFile();
        console.log("saved our state to disk");
    }
    /** @private @returns {LastState} */
    static async _getLastState() {
        // NOTE: This is private because after index.js loads, the LastState is likely meddled with. That is what HostUtility.lastState is for
        // NOTE: On the first boot ever, we'll treat it like the bot started & restarted this millisecond.
        if (LastState.get("created") !== true) {
            const mockOfLastRestartTime = Date.now();
            return {
                created: false,
                started: mockOfLastRestartTime,
                written: mockOfLastRestartTime,
                time: mockOfLastRestartTime,
                status: "restart",
                serialized: {},
            };
        }

        return structuredClone(LastState.data);
    }

    /**
     * Stops any handled processes or connections and tries to get the bot in a state ready for restart/shutdown.
     */
    static async gracefulClose() {
        try {
            BotState.shuttingDown = true;
            if (BotState.client)
                BotState.client.destroy();
            if (BotState.server)
                BotState.server.close();
        } catch (err) {
            console.warn("Graceful close failed;", err);
        }
    }

    /**
     * Marks the state as in use. This sets the lastState to active when the bot runs in the future.
     * If the other exit functions are never used, then you can check `lastState.status === "active"` to tell that the bot encountered an unexpected exit.
     */
    static async markInUse() {
        LastState.setLocal("status", "active");
        LastState.setLocal("time", Date.now());
        LastState.deleteLocal("error");
        await this.saveLastState();
    }
    /**
     * Saves the latest state and restarts the bot.
     * Never assume that this promise will actually resolve.
     */
    static async restart() {
        console.log("BOT: Restarting bot");
        LastState.setLocal("status", "restart");
        LastState.setLocal("time", Date.now());
        await this.saveLastState();

        console.info("BOT: Shutting down some stuff gracefully...");
        await this.gracefulClose();
        console.info("BOT: Exiting now");
        // NOTE: 50 is hardcoded in permrun.js to restart the bot
        process.exit(50);
    }
    /**
     * Saves the latest state and shuts down the bot. This assumes a successful intentional shutdown.
     * Never assume that this promise will actually resolve.
     */
    static async shutdown() {
        console.log("BOT: Shutting down through HostUtility");
        LastState.setLocal("status", "shutdown");
        LastState.setLocal("time", Date.now());
        await this.saveLastState();

        console.info("BOT: Shutting down some stuff gracefully...");
        await this.gracefulClose();
        console.info("BOT: Exiting now");
        process.exit(0);
    }
    /**
     * Saves the latest state and shuts down the bot with an error code. This is a formal abort/exit method.
     * This should only be used in an absolutely worst case scenario.
     * Never assume that this promise will actually resolve.
     */
    static async abort(error) {
        console.error("BOT: Aborting;", error);
        LastState.setLocal("status", "abort");
        LastState.setLocal("time", Date.now());
        if (error)
            LastState.setLocal("error", `${error}`);
        await this.saveLastState();

        console.info("BOT: Shutting down some stuff gracefully...");
        await this.gracefulClose();
        console.info("BOT: Exiting now");
        process.exit(1);
    }
}

module.exports = HostUtility;
