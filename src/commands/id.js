const Discord = require("discord.js");
const OptionType = require('../util/optiontype');

class Command {
    constructor() {
        this.name = "id";
        this.description = "Get discord id";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };
    }

    invoke(message, args) {
        // Create an array to hold the response lines
        const responseLines = [];

        // Add the message author's ID
        responseLines.push(`${message.author.username}'s id: \`\`\`${message.author.id}\`\`\``);

        // Check if the message contains mentions
        if (message.mentions.users.size > 0) {
            // Add each mentioned user's ID
            message.mentions.users.forEach(user => {
                responseLines.push(`${user.username}'s id: \`\`\`${user.id}\`\`\``);
            });
        }

        // Send the response message with all the IDs
        message.channel.send({content:responseLines.join('\n')});
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
