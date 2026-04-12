const discord = require('discord.js');
const Database = require('sync-json-database');
const ReactionMessageDB = new Database('./databases/spaces-reactionmsg.json');

const CommandUtility = require("./utility.js");

class ReactionMessageUtil {
    static getInvalidKeywordReason(keyword) {
        if (!keyword) return "Add a keyword that you will use to ping this role.";
        if (keyword.length <= 0 || keyword.length > 50) return "Your keyword must be 1-50 characters long.";
        if (keyword.match(/[^a-z0-9]/gi)) return "Only letters a-z and numbers 0-9 can be used for the keyword.";
        if (keyword.length <= 1 && keyword.match(/\d+/gi)) return "Keywords with numbers must be joined with a letter.";
        return null;
    }
    static getNewReactionMessageInvalidReason(reply, emoji, keyword) {
        const spaceChannelId = reply.channel.id;
        const roleList = ReactionMessageDB.get(`s-${spaceChannelId}-roles`);
        if (!roleList) return null; // if nonexistent, this space never had any roles
        if (roleList[keyword]) return "You've already used that keyword for a role in this space before.";

        // check the others for emoji
        for (const existingKeyword in roleList) {
            const existingRole = roleList[existingKeyword];
            if (existingRole.emoji === emoji) return "You've already used that emoji for a role in this space before.";
        }
        return null;
    }

    static createRole(reply, emoji, keyword) {
        // prep to add to DB. We assume getNewReactionMessageInvalidReason ran already
        const spaceChannelId = reply.channel.id;
        const roleList = ReactionMessageDB.get(`s-${spaceChannelId}-roles`) || {};
        const roleInfo = {
            emoji: emoji,
            keyword: keyword,
            id: reply.id,
            space: reply.channel.id,
            author: reply.author.id,
        };
        roleList[keyword] = roleInfo;

        // add to DB
        ReactionMessageDB.setLocal(`s-${spaceChannelId}-roles`, roleList);
        ReactionMessageDB.setLocal(`r-${spaceChannelId}-${keyword}-users`, []);
        ReactionMessageDB.saveDataToFile();
    }
    static removeRole(spaceId, keyword) {
        const roleList = ReactionMessageDB.get(`s-${spaceId}-roles`);
        if (!roleList) return; // no roles anyway

        delete roleList[keyword];
        ReactionMessageDB.setLocal(`s-${spaceId}-roles`, roleList);
        ReactionMessageDB.setLocal(`r-${spaceId}-${keyword}-users`, []);
        ReactionMessageDB.saveDataToFile();
    }
    static removeSpace(spaceId) {
        const roleList = ReactionMessageUtil.getRoles(spaceId)
        for (const keyword of roleList) {
            ReactionMessageDB.deleteLocal(`r-${spaceId}-${keyword}-users`, []);
        }

        ReactionMessageDB.deleteLocal(`s-${spaceId}-roles`);
        ReactionMessageDB.saveDataToFile();
    }

    static getSpaces() {
        const spacesKeys = ReactionMessageDB.array("keys");
        const spaceIds = spacesKeys.filter(key => key.startsWith("s-")).map(key => key.slice(2, key.indexOf("-roles")));
        return spaceIds;
    }
    static getRoles(spaceId) {
        const roleList = ReactionMessageDB.get(`s-${spaceId}-roles`);
        if (!roleList) return []; // no roles anyway
        return Object.keys(roleList);
    }
    static getKeywordForEmoji(spaceId, emoji) {
        const roleList = ReactionMessageDB.get(`s-${spaceId}-roles`);
        if (!roleList) return null; // if nonexistent, this space never had any roles

        // check the others for emoji
        for (const keyword in roleList) {
            const role = roleList[keyword];
            if (role.emoji === emoji) return keyword;
        }
        return null;
    }
    static getEmojiForKeyword(spaceId, keyword) {
        const roleList = ReactionMessageDB.get(`s-${spaceId}-roles`);
        if (!roleList) return; // no roles anyway
        const role = roleList[keyword];
        return role.emoji;
    }
    static getMessageIdForRole(spaceId, keyword) {
        const roleList = ReactionMessageDB.get(`s-${spaceId}-roles`);
        if (!roleList) return; // no roles anyway
        const role = roleList[keyword];
        return role.id;
    }
    static editUserInRole(spaceId, keyword, userId, shouldAdd, local) {
        const roleList = ReactionMessageDB.get(`s-${spaceId}-roles`);
        if (!roleList) return; // no roles anyway

        const userList = ReactionMessageDB.get(`r-${spaceId}-${keyword}-users`);
        if (!userList) return; // this role probably doesnt exist

        const userIndex = userList.indexOf(userId);
        if (shouldAdd && userIndex === -1) userList.push(userId);
        if (!shouldAdd && userIndex !== -1) userList.splice(userIndex, 1);
        
        if (local === true) return ReactionMessageDB.setLocal(`r-${spaceId}-${keyword}-users`, userList);
        ReactionMessageDB.set(`r-${spaceId}-${keyword}-users`, userList);
    }
    static getUsersOfRole(spaceId, keyword) {
        const roleList = ReactionMessageDB.get(`s-${spaceId}-roles`);
        if (!roleList) return []; // no roles
        const userList = ReactionMessageDB.get(`r-${spaceId}-${keyword}-users`);
        if (!userList) return []; // this role probably doesnt exist
        return userList;
    }

    static _collectors = {};

    /** @param {import("discord.js").Message} message */
    static createCollector(message, spaceId) {
        if (this._collectors[message.id]) return;

        const collectorFilter = (reaction, user) => {
            if (!user) return false;
            if (user.bot) return false;
            if (user.system) return false;

            const emojiIdentifier = reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name;
            const keyword = this.getKeywordForEmoji(spaceId, emojiIdentifier);
            return !!keyword;
        };

        // NOTE: between you and me, keep this secret: removal events will only fire if they react & unreact again
        const collector = message.createReactionCollector({ filter: collectorFilter, dispose: true });
        collector.on('collect', (reaction, user) => {
            if (!user) return;
            if (user.bot) return;
            if (user.system) return;

            const emojiIdentifier = reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name;
            const keyword = this.getKeywordForEmoji(spaceId, emojiIdentifier);
            if (!keyword) return;

            // add
            ReactionMessageUtil.editUserInRole(spaceId, keyword, user.id, true);
            console.log("added", user.id, "to", spaceId, keyword);
        });
        collector.on('remove', (reaction, user) => {
            if (!user) return;
            if (user.bot) return;
            if (user.system) return;

            const emojiIdentifier = reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name;
            const keyword = this.getKeywordForEmoji(spaceId, emojiIdentifier);
            if (!keyword) return;

            // remove
            ReactionMessageUtil.editUserInRole(spaceId, keyword, user.id, false);
            console.log("removed", user.id, "to", spaceId, keyword);
        });

        this._collectors[message.id] = collector;
    }
    /** @param {import("discord.js").Message} message */
    static removeCollector(message) {
        /** @type {import("discord.js").ReactionCollector} */
        const collector = this._collectors[message.id];
        if (!collector) return;

        this._collectors[message.id] = null;
        collector.stop();
    }

    static async updateReactingUsers(message, spaceId) {
        // add users that have reacted and remove users that are not reacted
        const roleList = ReactionMessageDB.get(`s-${spaceId}-roles`);
        if (!roleList) return; // no roles anyway

        const errors = [];
        for (const keyword in roleList) {
            const role = roleList[keyword];
            if (role.id !== message.id) continue;

            try {
                const reaction = await message.reactions.resolve(role.emoji);
                if (!reaction) continue;

                const activeUsers = this.getUsersOfRole(spaceId, keyword); // userIds
                const realUsers = await CommandUtility.getReactingUsers(reaction); // user objects
                const realUserIds = realUsers.map(user => user.id);
                const totalUsersToEvaluate = [].concat(activeUsers, realUserIds);

                for (const userId of totalUsersToEvaluate) {
                    // dont change anything
                    if (activeUsers.includes(userId) && realUserIds.includes(userId)) continue;

                    // add to the role
                    if (realUserIds.includes(userId) && !activeUsers.includes(userId)) {
                        ReactionMessageUtil.editUserInRole(spaceId, keyword, userId, true);
                        console.log("added", userId, "to", spaceId, keyword);
                    }

                    // remove from the role
                    if (!realUserIds.includes(userId) && activeUsers.includes(userId)) {
                        ReactionMessageUtil.editUserInRole(spaceId, keyword, userId, false);
                        console.log("removed", userId, "to", spaceId, keyword);
                    }
                }
            } catch (err) {
                console.warn("failed to handle reaction roles offline update;", err);
                errors.push(err);
            }
        }
        if (errors.length > 0) throw errors;
    }
    static async handleStartup(client) {
        // error tracking
        const missedSpaces = [];

        // get all of the spaces
        const spaceIds = this.getSpaces();
        for (const spaceId of spaceIds) {
            const roleList = ReactionMessageDB.get(`s-${spaceId}-roles`);
            if (!roleList) continue; // nothing to update

            try {
                // get all of the message ids we need to listen to
                const spaceChannel = await client.channels.fetch(spaceId);
                const messageIdsToListen = new Set();
                for (const keyword in roleList) {
                    const role = roleList[keyword];
                    messageIdsToListen.add(role.id);
                }

                // get the messages and make collectors and Pickup missing users that reacted while the bot was offline.
                for (const messageId of messageIdsToListen) {
                    const message = await spaceChannel.messages.fetch(messageId);
                    this.createCollector(message, spaceId);

                    // we just try catch this since it probably doesnt matter *that* much
                    try {
                        this.updateReactingUsers(message, spaceId);
                    } catch (err) {
                        console.warn("failed to update user reactions on roles;", err);
                    }
                }
            } catch (err) {
                // if a space was deleted
                if (err.code === discord.Constants.APIErrors.UNKNOWN_CHANNEL) {
                    console.log("space", spaceId, "deleted");
                    ReactionMessageUtil.removeSpace(spaceId);
                    continue; // stop the rest of the iteration and go to the next spaceId
                }

                missedSpaces.push([ spaceId, `${err}` ]);
            }
        }

        if (missedSpaces.length > 0) throw missedSpaces;
    }
}

module.exports = ReactionMessageUtil;