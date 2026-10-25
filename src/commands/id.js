const OptionType = require('../util/optiontype.js');
const BaseCommand = require("../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "id";
        this.description = "Get a user's Discord ID";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };
    }

    /** @param {import("discord.js").Message} message  */
    invoke(message, args) {
        return message.reply({
            content: [
                message.author,
                ...(message.mentions.users.size > 0 ? message.mentions.users.values() : []),
            ]
                .map(user => `${user.username}'s ID: \`\`${user.id}\`\``)
                .join('\n'),
            allowedMentions: {
                parse: [],
                users: [],
                roles: [],
                repliedUser: false
            }
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
