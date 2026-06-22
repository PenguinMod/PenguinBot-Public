const { MessageEmbed } = require("discord.js");
const { createCanvas, loadImage } = require('@napi-rs/canvas')
const crypto = require("crypto");
const OptionType = require('../util/optiontype');

const attackTexts = [
    'wins!',
    'slaps',
    'beats the shit out of',
    'responded with "who asked" to',
    'rejects all projects made by',
    'demotes',
    'puts a speech bubble under',
    'mutes',
    'leaks the IP of'
];
const attackDamage = [
    0, // win
    12, // slap
    11, // beats
    14, // who asked
    19, // reject
    15, // demote
    10, // speech bubble
    6, // mute
    1, // ip leak
];
const wait = time => new Promise(resolve => setTimeout(resolve, time));
const randomNumber = (items) => crypto.randomInt(1, items);
const activeBattles = [];

class Command {
    constructor(client, state) {
        this.name = "fight";
        this.description = "Fights another user.";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };
        this.example = [
            { text: `${state.prefix}fight @user1 @user2`, image: "fight_example1.png" },
            { text: `${state.prefix}fight @user` },
        ];
        this.slash = {
            options: [{
                type: OptionType.USER,
                name: 'opponent1',
                required: true,
                description: 'The opponent to fight with.'
            }, {
                type: OptionType.USER,
                name: 'opponent2',
                required: false,
                description: 'An opponent to fight with the other opponent.'
            }]
        };

        this.client = client;
    }

    convertSlashCommand(interaction, util) {
        const u1 = interaction.options.getMember('opponent1');
        const u2 = interaction.options.getMember('opponent2');

        interaction.author = interaction.member.user;
        interaction.mentions = {
            members: {
                at: (idx) => {
                    if (idx === 1) return u2;
                    return u1;
                }
            }
        };
        interaction.edit = interaction.editReply;
        return [interaction, true, util];
    }

    getUserAvatar(user) {
        const options = {
            format: 'png'
        };
        return user.avatarURL(options) ?? user.user.avatarURL(options);
    }
    denyMustMention(message) {
        message.reply('You must mention 2 people to fight eachother.');
    }

    async invoke(message, isSlash, util) {
        isSlash = isSlash === true;

        if (!message.mentions) return this.denyMustMention(message);
        if (!message.mentions.members) return this.denyMustMention(message);
        const u1 = message.mentions.members.at(0);
        const u2 = message.mentions.members.at(1) ?? message.member;
        if (!(u1 && u2)) return this.denyMustMention(message);

        if (u1.id !== message.author.id && util.interactionsBlocked(u1)) {
            return message.reply('The user you mentioned has interactions disabled.');
        }
        if (u2.id !== message.author.id && util.interactionsBlocked(u2)) {
            return message.reply('The user you mentioned has interactions disabled.');
        }

        if (activeBattles.length >= 2) {
            let list = activeBattles
                .map(name => `\`#${name}\``);
            list = [...new Set(list)]; // remove duplicates

            let denyMessage = `2 battles are already active in ${list.join(' and ')}.\nPlease wait for them to finish.`;
            message.reply(denyMessage);
            return;
        }

        activeBattles.push(message.channel.name);

        let u1Health = 100;
        let u2Health = 100;
        const attacks = [];
        const pushAttack = (user, attackId) => {
            switch (user) {
                case 'u1':
                    u2Health -= attackDamage[attackId];
                    u2Health = Math.max(0, u2Health);
                    break;
                case 'u2':
                    u1Health -= attackDamage[attackId];
                    u1Health = Math.max(0, u1Health);
                    break;
            }
            attacks.push([user, attackId]);
            if (attacks.length > 3) {
                attacks.shift();
            }
        };

        const embed = new MessageEmbed();
        embed.setDescription('nuh uh :BLEH:'); // this only shows before an attack is dished out
        const u1Entry = {
            name: u1.displayName,
            value: `${u1Health}/100`,
            inline: true
        };
        const u2Entry = {
            name: u2.displayName,
            value: `${u2Health}/100`,
            inline: true
        };
        embed.setFields(u1Entry, u2Entry);

        const u1Avatar = await loadImage(this.getUserAvatar(u1) ?? './assets/pink_default.jpg');
        const u2Avatar = await loadImage(this.getUserAvatar(u2) ?? './assets/pink_default.jpg');
        const image = await loadImage('assets/deathbattle.png');
        const loserImage = await loadImage('assets/deathbattle_loser.png');
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(u1Avatar, 8, 66, 128, 128);
        ctx.drawImage(u2Avatar, 187, 66, 128, 128);
        ctx.drawImage(image, 0, 0);
        ctx.font = `13px Sans`; // this font loads faster on my laptop :3
        ctx.textAlign = "center";
        ctx.fillText(u1.displayName, 70, 213, 130);
        ctx.fillText(u2.displayName, 251, 213, 130);
        
        // handle slash command updating
        let _board = message.reply({
            files: [canvas.toBuffer("image/png")],
            embeds: [embed]
        });
        if (!isSlash) {
            _board = await _board;
        } else {
            await _board;
            _board = message;
        }
        const board = _board;
        const updateInfo = () => {
            let battleState = "attack1";
            let lastAttack = '1';
            u1Entry.value = `${u1Health}/100`;
            u2Entry.value = `${u2Health}/100`;
            embed.setFields(u1Entry, u2Entry);
            const attackLog = attacks
                .map(([user, id]) => {
                    const attacker = user === 'u1'
                        ? u1.displayName
                        : u2.displayName;
                    if (id !== 0) {
                        const dmg = attackDamage[id]
                        const attacked = user === 'u1'
                            ? u2.displayName
                            : u1.displayName;
                        const emoji = user === 'u1'
                            ? '<:greenright:1179996859612282932>'
                            : '<:redleft:1179996861302583347>';
                        battleState = "attack" + (user === 'u1'
                            ? '1'
                            : '2');

                        return `${emoji} __${attacker}__ ${attackTexts[id]} __${attacked}__ for ${dmg} dmg`;
                    }
                    lastAttack = user === 'u1' ? '1' : '2';
                    battleState = "win";
                    return `<:gold_pengin:1158864673861537864> **${attacker}** wins!!!`;
                })
                .join('\n');

            // apparently discord.js has default colors for RED GREEN and GOLD
            switch (battleState) {
                case 'attack2':
                    embed.setColor('RED');
                    break;
                case 'win':
                    embed.setColor('GOLD');
                    // loser image shows on the person who didnt do the lastAttack
                    if (lastAttack === '1') {
                        ctx.drawImage(loserImage, 187, 66, 128, 128);
                    } else {
                        ctx.drawImage(loserImage, 8, 66, 128, 128);
                    }
                    break;
                default:
                    embed.setColor('GREEN');
                    break;
            }
            embed.setDescription(attackLog);
            if (battleState === 'win') {
                // only edit files if we actually changed the canvas
                board.edit({
                    files: [canvas.toBuffer("image/png")],
                    embeds: [embed]
                });
            } else {
                board.edit({ embeds: [embed] });
            }
        }

        // 1350 ms seems like a good time for discord ratelimit
        while (u1Health > 0 && u2Health > 0) {
            const u1Attack = randomNumber(attackTexts.length)
            const u2Attack = randomNumber(attackTexts.length)
            pushAttack('u1', u1Attack);
            updateInfo();
            await wait(1350);

            if (u2Health === 0) break;

            pushAttack('u2', u2Attack);
            updateInfo();
            await wait(1350);

            if (u1Health === 0) break;
        }
        const winner = u1Health > 0
            ? 'u1'
            : 'u2';
        pushAttack(winner, 0);
        updateInfo();
        activeBattles.pop();
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
