const { MessageEmbed } = require("discord.js");

class Command {
    constructor() {
        this.name = "msrole";
        this.description = "Give or remove the Meme Submitter Role.";
        this.attributes = {
            unlisted: true,
            permission: 3
        };
    }

    async invoke(message, args, util) {
        const prefix = util.request("prefix");
        
        // Check if the command has the required arguments
        if (args.length < 1) {
            return message.reply(`Usage: ${prefix}msrole <add/remove/list> @user`);
        }

        const action = args[0].toLowerCase();
        const targetUser = message.mentions.members.first();

        // Check if the user and role were mentioned
        if (!targetUser && action !== 'list') {
            return message.reply('Please mention a valid user.');
        }

        await message.guild.roles.fetch();
        let role = message.guild.roles.cache.find(role => role.id === '1178994941343567952');

        if (!role) {
            return message.reply('Role not found.');
        }

        switch (action) {
            case 'add': {
                // Add the role to the user
                targetUser.roles.add(role)
                    .then(() => {
                        message.reply(`Meme submitter role added to ${targetUser.user.tag}.`);
                    })
                    .catch((error) => {
                        console.error('Error adding role:', error);
                        message.reply('There was an error adding the role. Please check the bot permissions and try again.');
                    });
                break;
            }
            case 'remove': {
                // Remove the role from the user
                targetUser.roles.remove(role)
                    .then(() => {
                        message.reply(`Meme submitter role removed from ${targetUser.user.tag}.`);
                    })
                    .catch((error) => {
                        console.error('Error removing role:', error);
                        message.reply('There was an error removing the role. Please check the bot permissions and try again.');
                    });
                break;
            }
            case 'list': {
                const members = role.members;
                const embed = new MessageEmbed()
                    .setTitle('Members with Meme Submitter')
                    .setDescription(members.map(m => `<@${m.user.id}>`).join('\n'))
                    .setTimestamp();
                message.reply({
                    embeds: [embed],
                    allowedMentions: { // ping NO ONE.
                        parse: [],
                        users: [],
                        roles: [],
                        repliedUser: false
                    }
                });
                break;
            }
            default: {
                message.reply('Invalid action. Use `add`, `remove` or `list`.');
            }
        }
    }
}

module.exports = Command;
