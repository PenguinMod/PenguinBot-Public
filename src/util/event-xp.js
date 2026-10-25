const Database = require('sync-json-database');
const EventXPDatabase = new Database('./databases/event-xp.json');

class EventXP {
    static xpPerLevel = 100;

    /**
     * Convert XP into a level.
     * As of now, every 100 XP is a new level (not exponential)
     * @param {number} xp input xp
     * @returns {number} calculated level
     */
    static xpToLevel(xp) {
        return Math.floor(xp / this.xpPerLevel) + 1;
    }

    /**
     * Register a user in the database/update the specified info.
     * Changes are not saved until `commit()` commits them.
     * @param {string} userId
     * @param {object} shape
     * @param {string} shape.username the user's name
     */
    static registerLocal(userId, shape) {
        if (typeof userId !== 'string')
            throw new Error('userId must be a string');
        if (!shape)
            throw new Error('shape must be an object of the info to update');

        const existing = EventXPDatabase.get(userId);
        EventXPDatabase.setLocal(userId, {
            ...existing,
            ...shape
        });
    }

    /**
     * Get a user's XP and level.
     * @param {string} userId
     * @returns {Promise<{
     *   userId:string,
     *   username:string,
     *   xp:number,
     *   level:number,
     *   xpToNextLevel:number,
     *   rank:number,
     * }>}
     */
    static async get(userId) {
        if (typeof userId !== 'string') throw new Error('userId must be a string');

        const data = EventXPDatabase.get(userId) || {};
        const xp = data.xp ?? 0;
        const level = this.xpToLevel(xp);
        const xpToNextLevel = (level * this.xpPerLevel) - xp;

        const userLeaderboard = (await this._getSortedEntries())
            .find(entry => entry.userId === userId);
        const userRank = userLeaderboard ? userLeaderboard.rank : Infinity;
        return {
            userId,
            username: data.username,
            xp,
            level,
            xpToNextLevel,
            rank: userRank,
        };
    }
    /**
     * Set a user's XP.
     * Changes are not saved until `commit()` commits them.
     * @param {string} userId
     * @param {number} xp
     */
    static setLocal(userId, xp = 0) {
        if (typeof userId !== 'string') throw new Error('userId must be a string');
        if (!Number.isFinite(xp) || xp < 0)
            throw new Error('xp must be a non-negative number');

        const data = EventXPDatabase.get(userId);
        if (!data)
            throw new Error('user is not registered');
        EventXPDatabase.setLocal(userId, {
            ...data,
            xp
        });
    }
    /**
     * Update a user's XP using the old number as a reference.
     * Changes are not saved until `commit()` commits them.
     * @param {string} userId 
     * @param {(oldXp:number) => number|Promise<number>} callback A function to modify the XP value and return a new value
     */
    static updateLocal(userId, callback) {
        if (typeof userId !== 'string')
            throw new Error('userId must be a string');
        if (typeof callback !== 'function')
            throw new Error('callback must be a function');

        const data = EventXPDatabase.get(userId);
        if (!data)
            throw new Error('user is not registered');
        const xp = data.xp ?? 0;
        const newXp = callback(xp);
        if (typeof newXp !== "number")
            throw new Error("newXp is invalid");
        return this.setLocal(userId, newXp);
    }

    /**
     * @private returns sorted entries
     */
    static async _getSortedEntries() {
        // DISCLOSURE: ai was used for this
        const entries = EventXPDatabase
            .array()
            .map(({ key, value }) => ({
                userId: key,
                username: value.username,
                xp: value.xp ?? 0,
                level: this.xpToLevel(value.xp ?? 0)
            }))
            .sort((a, b) => {
                // Higher XP first.
                // User ID provides deterministic ordering for ties.
                if (b.xp !== a.xp)
                    return b.xp - a.xp;
                return a.userId.localeCompare(b.userId);
            })
            .map((entry, i) => ({
                // return rank here for use in displaying user's rank elsewhere
                rank: i + 1,
                ...entry,
            }));
        return entries;
    }
    /**
     * Get a paginated XP leaderboard.
     * @param {number} page
     * @param {number} pageSize Number of users per page (default: 10)
     * @returns {Promise<{
     *   page:number,
     *   pageSize:number,
     *   totalUsers:number,
     *   totalPages:number,
     *   entries:Array<{
     *     rank:number,
     *     userId:string,
     *     username:string,
     *     xp:number,
     *     level:number
     *   }>
     * }>}
     */
    static async getLeaderboard(page = 0, pageSize = 10) {
        // DISCLOSURE: ai was used for this
        if (!Number.isInteger(page) || page < 0)
            throw new Error('page must be a non-negative integer');
        if (!Number.isInteger(pageSize) || pageSize < 1)
            throw new Error('pageSize must be a positive integer');

        const entries = (await this._getSortedEntries())
            .filter(entry => entry.xp > 0);
        const totalUsers = entries.length;
        const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));
        const start = page * pageSize;
        const pagedEntries = entries
            .slice(start, start + pageSize);

        return {
            page,
            pageSize,
            totalUsers,
            totalPages,
            entries: pagedEntries
        };
    }

    /**
     * Commit data to the database file.
     */
    static async commit() {
        EventXPDatabase.saveDataToFile();
    }
}

module.exports = EventXP;
