const { MessageEmbed, MessageActionRow, MessageButton, CommandInteraction } = require('discord.js');
const OptionType = require('../util/optiontype');

class Command {
    constructor() {
        this.name = 'avatar';
        this.description = 'Get your avatar, or someone else\'s avatar.';
        this.attributes = {
            unlisted: false,
            permission: 0,
        };
        this.slash = {
            options: [{
                type: OptionType.USER,
                name: 'user',
                required: false,
                description: 'The user whose avatar you want to view'
            }, {
                type: OptionType.BOOLEAN,
                name: 'server',
                required: false,
                description: 'Whether to view the server avatar'
            }]
        };
    }

    convertSlashCommand(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const guild = interaction.options.getBoolean('server') || false;
        return [interaction, [user.id, guild ? 'guild' : '']];
    }

    async invoke(message, args) {
        let targetUser;

        // Check if the command is invoked via a slash command or a message
        if (message instanceof CommandInteraction) { // Slash command
            const userId = args[0];
            targetUser = await message.client.users.fetch(userId);
        } else { // Regular message command
            targetUser = message.mentions.users.first() || message.author;
        }

        // Check if "guild" is in the args
        let isGuildAvatar = args.includes('guild') || args.includes("server");

        // Helper function to generate the embed and components
        const generateMessage = async (isGuildAvatar) => {
            let avatar;
            if (isGuildAvatar) {
                const guildMember = await message.guild.members.fetch(targetUser.id);
                avatar = guildMember.avatarURL({ dynamic: true, size: 1024 }) || targetUser.displayAvatarURL({ dynamic: true, size: 1024 });
            } else {
                avatar = targetUser.displayAvatarURL({ dynamic: true, size: 1024 });
            }

            const embed = new MessageEmbed()
                .setTitle(`${targetUser.username}'s ${isGuildAvatar ? 'Server' : 'Global'} Avatar`)
                .setImage(avatar);

            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setLabel(`View ${isGuildAvatar ? 'Global' : 'Server'} Avatar`)
                        .setStyle('PRIMARY')
                        .setCustomId(isGuildAvatar ? 'global_avatar' : 'guild_avatar'),
                    new MessageButton()
                        .setLabel('View Avatar URL')
                        .setStyle('LINK')
                        .setURL(avatar)
                );

            return { embeds: [embed], components: [row] };
        };

        const messageContent = await generateMessage(isGuildAvatar);
        const replyOptions = { ...messageContent };

        let sentMessage;
        if (message instanceof CommandInteraction) {
            sentMessage = await message.reply({ ...replyOptions, ephemeral: true });
        } else {
            sentMessage = await message.reply(replyOptions);

            const filter = i => (i.customId === 'guild_avatar' || i.customId === 'global_avatar') && i.user.id === message.author.id;
            const collector = sentMessage.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                isGuildAvatar = i.customId === 'guild_avatar';
                const updatedContent = await generateMessage(isGuildAvatar);
                await i.update({ ...updatedContent });
            });
        }
    }
}

module.exports = Command;
