const discord = require('discord.js');

const Sokoban = require('../../../util/sokoban.js');
const SokobanDB = require('../../../util/sokobandb.js');

const BaseBotEvent = require('../../../classes/base-bot-event.js');

class BotEvent extends BaseBotEvent {
    constructor() {
        super();
        this.listener = "interactionCreate";
        this.once = false;
    }

    /**
     * Runs when the event is invoked
     * @param {import("discord.js").Interaction} interaction 
     * @returns {Promise<any>}
     */
    async invoke(interaction) {
        if (!interaction.isButton()) return;

        const userId = interaction.user.id;

        if (interaction.customId.includes("move_")) {
            try {
                const customEmojis = SokobanDB.get(`${userId}_emojis`) || {
                    wall: ':red_square:',
                    player: ':flushed:',
                    empty: '⬛',
                    goal: '🎯',
                    box: '📦'
                };

                const gameState = SokobanDB.get(userId);
                if (!gameState) return;

                const game = new Sokoban(gameState, customEmojis);
                const direction = interaction.customId.split('_')[1];
                let response = game.move(direction);

                if (game.isLevelCompleted()) {
                    game.levelNumber++;
                    game.generateNewLevel();
                    response = 'Level completed! Generating a new level...\n';
                    response += game.getLevelWithEmojis();
                }

                SokobanDB.set(userId, game.serialize());

                const embed = new discord.MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle(`Level ${game.levelNumber} | Sokoban`)
                    .setDescription(response)
                    .setFooter({ text: 'Use the buttons below to move' });

                await interaction.update({ embeds: [embed] });
            } catch (error) {
                console.error('Error handling move interaction:', error);
                await interaction.reply({ content: 'There was an error processing your move.', ephemeral: true });
            }
        } else if (interaction.customId === "del") {
            try {
                const threadId = SokobanDB.get(`${userId}_threadId`);
                if (threadId) {
                    const gameThread = await interaction.guild.channels.fetch(threadId);
                    if (gameThread) {
                        await gameThread.delete();
                    }
                }
                SokobanDB.deleteLocal(userId);
                SokobanDB.deleteLocal(`${userId}_gameMessageId`);
                SokobanDB.deleteLocal(`${userId}_threadId`);
                SokobanDB.saveDataToFile();
                await interaction.user.send('Your game has been deleted.');
                await interaction.reply({ content: 'Your game has been deleted.', ephemeral: true });
            } catch (error) {
                console.error('Error deleting game thread:', error);
                await interaction.reply({ content: 'There was an error deleting your game thread.', ephemeral: true });
            }
        }
    }
}

module.exports = BotEvent;