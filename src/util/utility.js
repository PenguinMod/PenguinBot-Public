const discord = require("discord.js");

const Database = require('sync-json-database');
const DisabledInteractionsDB = new Database('./databases/disabled-interactions.json');

/**
 * Utilities used across the bot.
 */
class Utility {
    /**
     * Check if someone has interactions disabled
     * @param {string|discord.User} userOrId 
     * @returns {boolean}
     */
    static interactionsBlocked(userOrId) {
        if (!userOrId)
            return false;

        // get the actual ID to target
        const id = typeof userOrId !== 'string' ? userOrId.id : userOrId;
        if (!id || typeof id !== 'string')
            return false;
        // check if they have it blocked
        const isBlocked = DisabledInteractionsDB.get(id);
        return isBlocked === true;
    }
}

module.exports = Utility;
