const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas')
const axios = require('axios');
const fetch = require('node-fetch');

// Function to generate an image
async function generateBlackjackImage(playerHand, dealerHand, playerScore, dealerCardBack) {
    const width = 1000;  // Increased width
    const height = 600;  // Increased height
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Fill the background
    ctx.fillStyle = '#2e3b4e'; // Dark blue background
    ctx.fillRect(0, 0, width, height);

    // Load card images
    const playerCardImages = await Promise.all(playerHand.map(card => fetch(card.image).then(res => res.buffer()).then(buffer => loadImage(buffer))));
    const dealerCardBackImage = await loadImage(dealerCardBack);

    // Draw dealer's face-up card
    ctx.fillStyle = '#ffffff'; // White for text
    ctx.font = '30px Arial';
    ctx.fillText("Dealer's Card:", 20, 50);

    ctx.drawImage(playerCardImages[0], 20, 70, 120, 170); // Draw dealer's face-up card

    // Draw dealer's face-down cards
    ctx.fillText(`Dealer's Other Cards: ${dealerHand.length - 1}`, 300, 50);
    for (let i = 1; i < dealerHand.length; i++) {
        ctx.drawImage(dealerCardBackImage, 20 + (i * 130), 70, 120, 170); // Draw dealer's face-down cards
    }

    // Draw player's cards
    ctx.fillText("Your Hand:", 20, 350);

    playerHand.forEach((card, index) => {
        ctx.drawImage(playerCardImages[index], 20 + (index * 130), 370, 120, 170); // Draw player's cards
    });

    // Draw player score
    ctx.font = '24px Arial';
    ctx.fillText(`Your Score: ${playerScore}`, 20, height - 20);

    // Return the image buffer
    return canvas.toBuffer('image/png');
}

class Command {
    constructor() {
        this.name = "blackjack";
        this.description = "Play a game of Blackjack";
        this.attributes = {
            unlisted: false,
            admin: false,
            lockedToCommands: true,
        };
    }

    async invoke(message) {
        const player = message.author;
        const deckId = await this.createDeck();
        let playerHand = [];
        let dealerHand = [];

        await this.shuffleDeck(deckId);

        playerHand.push(await this.drawCard(deckId));
        playerHand.push(await this.drawCard(deckId));
        dealerHand.push(await this.drawCard(deckId));
        dealerHand.push(await this.drawCard(deckId));

        let playerScore = this.calculateScore(playerHand);
        let dealerScore = this.calculateScore(dealerHand);

        let playerTurn = true;
        let gameMessage;

        const hitButton = new MessageButton()
            .setCustomId('hit')
            .setLabel('Hit')
            .setStyle('PRIMARY');

        const standButton = new MessageButton()
            .setCustomId('stand')
            .setLabel('Stand')
            .setStyle('SECONDARY');

        const row = new MessageActionRow()
            .addComponents(hitButton, standButton);

        // Generate and send the initial image
        const imageBuffer = await generateBlackjackImage(playerHand, dealerHand, playerScore, 'https://www.deckofcardsapi.com/static/img/back.png');
        gameMessage = await message.channel.send({ files: [{ attachment: imageBuffer, name: 'blackjack.png' }], components: [row] });

        const filter = interaction => interaction.user.id === player.id;
        const collector = gameMessage.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async interaction => {
            if (interaction.customId === 'hit') {
                const newCard = await this.drawCard(deckId);
                playerHand.push(newCard);
                playerScore = this.calculateScore(playerHand);

                const newImageBuffer = await generateBlackjackImage(playerHand, dealerHand, playerScore, 'https://www.deckofcardsapi.com/static/img/back.png');
                if (playerScore > 21) {
                    await interaction.update({ content: 'Busted! You lose.', files: [{ attachment: newImageBuffer, name: 'blackjack.png' }], components: [] });
                    collector.stop();
                } else {
                    await interaction.update({ files: [{ attachment: newImageBuffer, name: 'blackjack.png' }] });
                }
            } else if (interaction.customId === 'stand') {
                collector.stop();
            }
        });

        collector.on('end', async () => {
            while (dealerScore < 17 && playerScore <= 21) {
                dealerHand.push(await this.drawCard(deckId));
                dealerScore = this.calculateScore(dealerHand);
            }

            const resultEmbed = new MessageEmbed()
                .setTitle(`${player.username}'s Blackjack Game`)
                .addField('Your Hand', `${this.formatHand(playerHand)}\n(Score: ${playerScore})`, true)
                .addField("Dealer's Hand", `${this.formatHand(dealerHand)}\n(Score: ${dealerScore})`, true);

            const resultImageBuffer = await generateBlackjackImage(playerHand, dealerHand, playerScore, 'https://www.deckofcardsapi.com/static/img/back.png');

            if (playerScore > 21) {
                resultEmbed.setDescription('You busted! Dealer wins.').setColor('RED');
            } else if (dealerScore > 21 || playerScore > dealerScore) {
                resultEmbed.setDescription('You win!').setColor('GREEN');
            } else if (playerScore === dealerScore) {
                resultEmbed.setDescription("It's a tie!").setColor('YELLOW');
            } else {
                resultEmbed.setDescription('Dealer wins!').setColor('RED');
            }

            const againButton = new MessageButton()
                .setCustomId('again')
                .setLabel('Again!')
                .setStyle('PRIMARY');

            const againRow = new MessageActionRow()
                .addComponents(againButton);

            await gameMessage.edit({ embeds: [resultEmbed], files: [{ attachment: resultImageBuffer, name: 'blackjack.png' }], components: [againRow] });

            const againCollector = gameMessage.createMessageComponentCollector({ filter, time: 60000 });

            againCollector.on('collect', async interaction => {
                if (interaction.customId === 'again') {
                    await gameMessage.delete();
                    this.invoke(message);
                }
            });
        });
    }

    async createDeck() {
        const response = await axios.get('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1');
        return response.data.deck_id;
    }

    async shuffleDeck(deckId) {
        await axios.get(`https://deckofcardsapi.com/api/deck/${deckId}/shuffle/`);
    }

    async drawCard(deckId) {
        const response = await axios.get(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`);
        return response.data.cards[0];
    }

    calculateScore(hand) {
        let score = 0;
        let aceCount = 0;
        for (let card of hand) {
            const value = card.value;
            if (value === 'ACE') {
                aceCount++;
                score += 11;
            } else if (['KING', 'QUEEN', 'JACK'].includes(value)) {
                score += 10;
            } else {
                score += parseInt(value);
            }
        }
        while (score > 21 && aceCount > 0) {
            score -= 10;
            aceCount--;
        }
        return score;
    }

    formatHand(hand) {
        return hand.map(card => `${card.value} of ${card.suit}`).join(", ");
    }
}

module.exports = Command;
