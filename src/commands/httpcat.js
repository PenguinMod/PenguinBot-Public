const Discord = require("discord.js");
const OptionType = require('../util/optiontype');

class Command {
    constructor() {
        this.name = "httpcat";
        this.description = "Get a cute http cat image using an HTTP Code";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };
    }

    invoke(message, args) {
        const statusCode = parseInt(args[0]);

        // Check if the provided argument is a valid HTTP status code
        if (isNaN(statusCode) || statusCode < 100 || statusCode >= 600) {
          message.reply('Please provide a valid HTTP status code.');
          return;
        }
    
        // Generate the http.cat image URL
        const imageUrl = `https://http.cat/${statusCode}`;
        const embed = new Discord.MessageEmbed().setTitle(`Cat HTTP Code ${statusCode}`).setImage(`${imageUrl}.jpg`);
        message.reply({ embeds: [embed] });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;

//mubi was here :3