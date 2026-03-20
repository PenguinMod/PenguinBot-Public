const Database = require('sync-json-database');
const ReactionMessageDB = new Database('./databases/spaces-reactionmsg.json');

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
    static getMessageIdForRole(spaceId, keyword) {
        const roleList = ReactionMessageDB.get(`s-${spaceId}-roles`);
        if (!roleList) return; // no roles anyway
        const role = roleList[keyword];
        return role.id;
    }
    static editUserInRole(spaceId, keyword, userId, shouldAdd) {
        const roleList = ReactionMessageDB.get(`s-${spaceId}-roles`);
        if (!roleList) return; // no roles anyway

        const userList = ReactionMessageDB.get(`r-${spaceId}-${keyword}-users`);
        if (!userList) return; // this role probably doesnt exist

        const userIndex = userList.indexOf(userId);
        if (shouldAdd && userIndex === -1) userList.push(userId);
        if (!shouldAdd && userIndex !== -1) userList.splice(userIndex, 1);
        ReactionMessageDB.set(`r-${spaceId}-${keyword}-users`, userList);
    }
    static getUsersOfRole(spaceId, keyword) {
        const roleList = ReactionMessageDB.get(`s-${spaceId}-roles`);
        if (!roleList) return []; // no roles
        const userList = ReactionMessageDB.get(`r-${spaceId}-${keyword}-users`);
        if (!userList) return []; // this role probably doesnt exist
        return userList;
    }
}

module.exports = ReactionMessageUtil;