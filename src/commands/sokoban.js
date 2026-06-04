const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const Sokoban = require('../util/sokoban');
const db = require('../util/sokobandb');

class Command {
    constructor() {
        this.name = 'sokoban';
        this.description = 'Play Sokoban game';
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };
        this.alias = ["skb"];
    }

    async invoke(message, args, util) {
        const command = args[0];
        const userId = message.author.id;

        if (command === 'start') {
            const existingGameState = db.get(userId);
            if (existingGameState) {
                const existingGameThread = db.get(`${userId}_threadId`);
                message.reply(`You already have a game running on <#${existingGameThread}>. Please delete your current game before starting a new one.`);
                return;
            }

            const customEmojis = db.get(`${userId}_emojis`) || {
                wall: ':red_square:',
                player: ':flushed:',
                empty: '⬛',
                goal: '🎯',
                box: '📦'
            };
            const game = new Sokoban(null, customEmojis);
            db.set(userId, game.serialize());
            const response = game.getLevelWithEmojis();

            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle(`Level ${game.levelNumber} | Sokoban`)
                .setDescription(response)
                .setFooter({ text: 'Use the buttons below to move' });

            const row1 = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('clear_up')
                        .setLabel('‎ ')
                        .setStyle('SECONDARY')
                        .setDisabled(true),
                    new MessageButton()
                        .setCustomId('move_up')
                        .setEmoji('⬆️')
                        .setStyle('PRIMARY'),
                    new MessageButton()
                        .setCustomId('clear_up_2')
                        .setLabel('‎ ')
                        .setStyle('SECONDARY')
                        .setDisabled(true)
                );

            const row2 = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('move_left')
                        .setEmoji('⬅️')
                        .setStyle('PRIMARY'),
                    new MessageButton()
                        .setCustomId('clear_center')
                        .setLabel('‎ ')
                        .setStyle('SECONDARY')
                        .setDisabled(true),
                    new MessageButton()
                        .setCustomId('move_right')
                        .setEmoji('➡️')
                        .setStyle('PRIMARY')
                );

            const row3 = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('clear_down')
                        .setLabel('‎ ')
                        .setStyle('SECONDARY')
                        .setDisabled(true),
                    new MessageButton()
                        .setCustomId('move_down')
                        .setEmoji('⬇️')
                        .setStyle('PRIMARY'),
                    new MessageButton()
                        .setCustomId('del')
                        .setLabel('‎🗑️')
                        .setStyle('SECONDARY')
                        .setDisabled(false)
                );

            const gameThread = await message.startThread({
                name: `Sokoban Game - ${message.author.username}`,
                autoArchiveDuration: 10080,
                type: 'private_thread'
            });

            const gameMessage = await gameThread.send({ embeds: [embed], components: [row1, row2, row3] });
            db.setLocal(`${userId}_gameMessageId`, gameMessage.id);
            db.setLocal(`${userId}_threadId`, gameThread.id);
            db.saveDataToFile();

            this.cleanUpNonCommands(gameThread, userId, util.request("prefix"));
        } else if (command === 'config') {
            await this.configureEmojis(message);
            return;
        } else if (command === 'delete' || command === 'end' || command === 'del') {
            await this.deleteGame(message, userId);
            return;
        } else {
            const gameState = db.get(userId);
            if (!gameState) {
                const prefix = util.request("prefix");
                const embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle('Sokoban Game Commands')
                    .setDescription(`You need to start a game first by using \`${prefix}sokoban start\`.`)
                    .addFields(
                        { name: 'Start Game', value: `\`${prefix}sokoban start\` - Start a new Sokoban game.` },
                        { name: 'Move Player', value: `\`Buttons on Game UI\` - Move the player in the specified direction (e.g., up, down, left, right).` },
                        { name: 'Configure Emojis', value: `\`${prefix}sokoban config\` - Configure custom emojis for the game.` },
                        { name: 'Delete Game', value: `\`${prefix}sokoban end\` - Delete the current game and thread.` }
                    );

                message.reply({ embeds: [embed] });
                return;
            }
        }
    }

    async configureEmojis(message) {
        const userId = message.author.id;

        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Configure Emojis')
            .setDescription('Click a button to configure the corresponding emoji.');

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('config_wall')
                    .setLabel('Wall')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId('config_player')
                    .setLabel('Player')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId('config_empty')
                    .setLabel('Empty')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId('config_goal')
                    .setLabel('Goal')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId('config_box')
                    .setLabel('Box')
                    .setStyle('PRIMARY')
            );

        const configThread = await message.startThread({
            name: `Sokoban Config - ${message.author.username}`,
            autoArchiveDuration: 10080,
            type: 'private_thread'
        });

        const configMessage = await configThread.send({ embeds: [embed], components: [row] });

        const filter = i => i.user.id === userId;
        const collector = configMessage.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async interaction => {
            const emojiType = interaction.customId.split('_')[1];
            await interaction.update({ content: `Please enter the emoji for ${emojiType}.`, components: [] });

            const emojiMessageFilter = response => response.author.id === userId;
            const emojiMessageCollector = interaction.channel.createMessageCollector({ emojiMessageFilter, max: 1, time: 30000 });

            emojiMessageCollector.on('collect', async response => {
                const emoji = response.content.trim();
                const validEmoji = this.isValidEmoji(emoji) ? emoji : this.getDefaultEmoji(emojiType);

                const customEmojis = db.get(`${userId}_emojis`) || {};
                customEmojis[emojiType] = validEmoji;
                db.set(`${userId}_emojis`, customEmojis);

                await configMessage.edit({ content: `Emoji for ${emojiType} set to ${validEmoji}`, embeds: [embed], components: [row] });
                response.delete();
            });
        });

        this.cleanUpNonCommands(configThread, userId, util.request("prefix"));
    }

    async deleteGame(message, userId) {
        const threadId = db.get(`${userId}_threadId`);
        if (threadId) {
            try {
                const gameThread = await message.guild.channels.fetch(threadId);
                if (gameThread) {
                    await gameThread.delete();
                }
            } catch (error) {
                console.error('Error deleting game thread:', error);
                message.reply('There was an error deleting your game thread.');
            }
        }
        db.deleteLocal(userId);
        db.deleteLocal(`${userId}_gameMessageId`);
        db.deleteLocal(`${userId}_threadId`);
        db.saveDataToFile();
        message.reply('Your game has been deleted.');
    }

    isValidEmoji(emoji) {
        const customEmojiPattern = /^<a?:\w+:\d+>$/;
        return customEmojiPattern.test(emoji) || /\p{Extended_Pictographic}/u.test(emoji);
    }

    getDefaultEmoji(type) {
        const defaultEmojis = {
            wall: ':red_square:',
            player: ':flushed:',
            empty: '⬛',
            goal: '🎯',
            box: '📦'
        };
        return defaultEmojis[type];
    }

    cleanUpNonCommands(thread, userId, prefix) {
        const filter = message => message.author.id !== userId && !message.content.startsWith(`${prefix}sokoban`);
        const collector = thread.createMessageCollector({ filter });
    
        collector.on('collect', async message => {
            if (message.deletable) {
                await message.delete();
            }
    
            if (message.content.startsWith(`${prefix}sokoban`)) {
                const msg = await message.channel.send("Please use commands outside of the thread");
                setTimeout(() => {
                    msg.delete();
                }, 2000);
            }
        });
    }
}

module.exports = Command;
