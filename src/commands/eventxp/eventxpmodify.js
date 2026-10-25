const discord = require('discord.js');

const EventXP = require("../../util/event-xp.js");
const DiscordUtility = require("../../util/utility-discord.js");

const BaseCommand = require("../../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "eventxpmodify";
        this.description = "Modify a user's event XP.";
        this.attributes = {
            unlisted: true,
            eventManagers: true,
        };

        this.example = [
            { text: "{{prefix}}eventxpmodify add 100 (userId)" },
            { text: "{{prefix}}eventxpmodify subtract 100 (userId)" },
            { text: "{{prefix}}eventxpmodify set 200 (userId)" },
            { text: "{{prefix}}eventxpmodify + 100 (userId) (userId2) (userId3)" },
        ];
    }

    /**
     * @param {import("discord.js").Message} message 
     * @param {string[]} args 
     * @param {import("../../util/utility-command.js")} util 
     */
    async invoke(message, args, util) {
        // NOTE: I think equals (=) is too close to minus (-) on the keyboard to be trusted as an alias for `set`
        const action = args.shift();
        const sign = (action === "subtract" || action === "-") ? -1 : 1;
        if (!["add", "subtract", "set", "+", "-"].includes(action))
            return this.reject(message, "Specify either `add` (`+`), `subtract` (`-`), or `set`.");
        const newXp = Number(args.shift());
        if (isNaN(newXp) || !isFinite(newXp))
            return this.reject(message, "You need to specify a number of XP to grant.");

        /** @type {discord.User[]} For each user ID specified in `args`, we need to either: grab them from cache, or fetch them. (Error outright if we fail to grab everyone.) Then run the loop. */
        const users = [];
        for (const userId of args) {
            if (!userId) continue;
            if (users.some(user => user.id === userId)) continue;
            try {
                const user = message.client.users.cache.get(userId)
                    || (await message.client.users.fetch(userId));
                users.push(user);
            } catch {
                return this.reject(message, `Could not find user \`${userId}\`.`);
            }
        }
        
        for (const user of users) {
            const userId = user.id;
            const username = user.username;
            EventXP.registerLocal(userId, { username: username });
            switch (action) {
                case "add":
                case "subtract":
                case "+":
                case "-":
                    EventXP.updateLocal(userId, (oldXp) => Math.max(0, oldXp + (newXp * sign)));
                    break;
                case "set":
                    EventXP.setLocal(userId, Math.max(0, newXp));
                    break;
            }
        }

        await EventXP.commit();
        message.reply(`Edited XP for ${users.length} users.`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;