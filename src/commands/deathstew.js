const crypto = require("crypto");

const discord = require("discord.js");
const Canvas = require('skia-canvas');

const OptionType = require('../util/optiontype.js');
const DiscordUtility = require("../util/utility-discord.js");
const SkiaCanvasUtil = require("../util/canvas-util-skia.js");

const BaseCommand = require("../classes/basecommand.js");

const delay = time => new Promise(resolve => setTimeout(resolve, time));

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "deathstew";
        this.description = "Players take turn drinking poisonous stews.";
        this.descriptionLong = "Players take turn drinking poisonous stews."
            + "\n" + "To play with specific people, mention one or more opponents to play with."
            + "\n" + "If you don't mention anybody, then the game is free for anybody to join."
            + "\n" + "All opponents must agree to start the game in 30 seconds."
            + "\n"
            + "\n" + "The game plays like so:"
            + "\n" + "-" + " " + "A player takes a stew from a set of stews."
            + "\n" + "-" + " " + "They drink the stew, and either live, or get poisoned."
            + "\n" + "-" + " " + "If the player gets poisoned, then the stews are reset and that player is out."
            + "\n" + "-" + " " + "The next player takes a stew, and repeat until the game ends.";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };
        this.example = [
            { text: `{{prefix}}deathstew @opp` },
            { text: `{{prefix}}deathstew @opp1 @opp2` },
            { text: `{{prefix}}deathstew @opp1 @opp2 @opp3` },
        ];

        this.alias = ["deathstews", "deathsoup", "deathsoups", "russianroulette"];

        /** @type {string?} */
        this.activeBattle = null;
    }

    /**
     * @param {discord.Message} message 
     * @param {string[]} args 
     * @param {import("../util/utility-command.js")} util 
     * @returns 
     */
    async invoke(message, args, util) {
        if (this.activeBattle)
            return message.reply(`A game is already active in <#${this.activeBattle}>.\nPlease wait for them to finish.`);
        
        /** @type {discord.GuildMember[]} */
        const specificMembers = [];
        if (message.mentions && message.mentions.members && message.mentions.members.size) {
            specificMembers.push(message.member, ...message.mentions.members.values());
            if (specificMembers.some(member => !util.canInteract(member.id)))
                return message.reply('The user you mentioned has interactions disabled.');
        }
        
        // take up the active slot before we do anything asynchronous
        this.activeBattle = message.channelId;

        try {
            // make the initial embed, we are in a waiting stage so dont make an image yet
            const embed = new discord.MessageEmbed();
            embed.setTitle(`Death Stew`);
            embed.setDescription("🛑 **Joining users must click the reaction to start**"
                + "\n" + (specificMembers.length ? "This game is only open to the mentioned members."
                    : "This game is open for anyone to join."));
            embed.setColor("AQUA");

            let gameImageDirty = false;
            let gameImageBuffer = null;
            const gameMessage = await message.reply({ embeds: [embed] });

            // listen for reactions
            const joiningMembers = [message.member];
            // const joiningMembers = specificMembers;
            const reactionForStartDate = Date.now();
            const reactionJoinAdd = (reaction, user) => {
                if (reaction.message.id !== gameMessage.id) return;
                if (specificMembers.length && !specificMembers.find(member => member.id === user.id))
                    return;
                // NOTE: For fun & testing, the bot can join games, but they have to be pinged
                if (user.id === this.client.user.id && !specificMembers.find(member => member.id === this.client.user.id))
                    return;
                if (joiningMembers.find(member => member.id === user.id))
                    return;
                if (reaction.emoji.name !== '🛑')
                    return;

                const member = gameMessage.guild.members.cache.get(user.id);
                joiningMembers.push(member);
            };

            await new Promise(async (resolve) => {
                // listen for reactions & add our own
                this.client.on("messageReactionAdd", reactionJoinAdd);
                await gameMessage.react("🛑");

                // wait for the timeout before resolving
                while ((Date.now() - reactionForStartDate < 30000) && (!specificMembers.length || (joiningMembers.length < specificMembers.length)))
                    await delay(200);
                resolve();
            });
            this.client.off("messageReactionAdd", reactionJoinAdd);
            if (specificMembers.length && (joiningMembers.length < specificMembers.length))
                return message.reply("The game ended because not all players joined.");
            if (joiningMembers.length < 2)
                return message.reply("The game ended because at least 2 players need to participate.");

            // start making the game llogic, image & such
            embed.setFooter({ text: `${joiningMembers.length} players` })

            /** @type {discord.GuildMember[]} */
            const aliveMembers = [...joiningMembers];
            let activeMember = aliveMembers.at(0);
            let activeMemberPoisoned = false;
            let winningMember = null;

            // stews. stewIdx shows which one we are on, stews has the stew type, and stewsTried tells which ones are eaten
            let stewIdx = 0;
            /** @type {boolean[]} true = poisoned */
            const stews = [];
            /** @type {boolean[]} match the idx with stews to get stew type */
            const stewsTried = [];
            const createStews = () => {
                stews.splice(0, Infinity);
                stewsTried.splice(0, Infinity);
                for (const _ of aliveMembers)
                    stews.push(false);
                stewsTried.push(...stews);
                stews[Math.round(Math.random() * (stews.length - 1))] = true;
            };

            // NOTE: We assume that the game members & image will only update when a log is pushed.
            const gameTextLog = [];
            const pushTextLog = async (text) => {
                // update the log
                gameTextLog.push(text);
                if (gameTextLog.length > 3) {
                    gameTextLog.shift();
                }

                // update the message
                embed.setDescription(gameTextLog.join('\n'));
                embed.setFields([
                    {
                        name: winningMember ? "Winner" : "Your turn,",
                        value: `<@${winningMember ? winningMember.id : activeMember.id}>`,
                    },
                    {
                        name: "Alive",
                        value: `${aliveMembers.map(member => `<@${member.id}>`).join(", ")}`.substring(0, 1024),
                    },
                    ...(!winningMember ? [] : [{
                        // only list dead members on game end
                        name: "Dead",
                        value: `${joiningMembers.filter(member => !aliveMembers.find(alive => alive.id === member.id)).map(member => `<@${member.id}>`).join(", ")}`.substring(0, 1024),
                    }]),
                ]);

                // Make a discord attachment and put it on the embed
                if (!gameImageDirty || !gameImageBuffer) {
                    await gameMessage.edit({
                        embeds: [embed],
                    });
                } else {
                    const attachment = new discord.MessageAttachment(gameImageBuffer, "deathstew.png");
                    embed.setImage("attachment://deathstew.png");
                    gameImageDirty = false;
                    await gameMessage.edit({
                        embeds: [embed],
                        files: [attachment],
                    });
                }
            };

            // make the image
            const userAvatars = new Map();
            const imageBackgroundActive = await Canvas.loadImage('assets/deathstew/game_active.png');
            const imageBackgroundPoison = await Canvas.loadImage('assets/deathstew/game_poison.png');
            const imageBackgroundWinner = await Canvas.loadImage('assets/deathstew/game_winner.png');
            const imageStewFull = await Canvas.loadImage("assets/deathstew/stew_full.png");
            const imageStewEvil = await Canvas.loadImage("assets/deathstew/stew_evil.png");
            const imageStewNone = await Canvas.loadImage("assets/deathstew/stew_none.png");
            const imageIconDead = await Canvas.loadImage('assets/deathstew/dead.png');

            const canvas = new Canvas.Canvas(imageBackgroundActive.width, imageBackgroundActive.height);
            const ctx = canvas.getContext('2d');
            const createImage = async () => {
                const memberToDraw = winningMember || activeMember;
                const userAvatar = userAvatars.get(memberToDraw.id)
                    || await Canvas.loadImage(DiscordUtility.avatarURL(memberToDraw));
                userAvatars.set(memberToDraw.id, userAvatar);

                // draw the avatar image
                ctx.fillStyle = "white";
                ctx.fillRect(242, 5, 61, 61);
                ctx.drawImage(userAvatar, 242, 5, 61, 61);
                if (activeMemberPoisoned && !winningMember)
                    ctx.drawImage(imageIconDead, 242, 5, 61, 61);

                // draw the background
                if (winningMember)
                    ctx.drawImage(imageBackgroundWinner, 0, 0);
                else if (activeMemberPoisoned)
                    ctx.drawImage(imageBackgroundPoison, 0, 0);
                else
                    ctx.drawImage(imageBackgroundActive, 0, 0);

                // draw the username
                ctx.font = `bold 28px sans-serif`;
                ctx.fillStyle = "white";
                ctx.textAlign = "left";
                ctx.textBaseline = 'alphabetic';
                SkiaCanvasUtil.fillText(ctx, memberToDraw.displayName || memberToDraw.username, 6, 41 + 28, 176);

                // realign the stews arrays to make our current stew first
                const realignedStews = [...stews];
                const realignedStewsTried = [...stewsTried];
                realignedStews.push(...realignedStews.splice(0, stewIdx));
                realignedStewsTried.push(...realignedStewsTried.splice(0, stewIdx));
                // draw the stews
                // https://developer.mozilla.org/en-US/blog/javascript-shape-drawing-function/
                for (let i = 0; i < realignedStews.length; i++) {
                    const stew = realignedStews[i];
                    const stewTried = realignedStewsTried[i];

                    const stewImage = stew && activeMemberPoisoned ? imageStewEvil
                        : (stewTried ? imageStewNone : imageStewFull);
                    if (realignedStews.length === 1) {
                        // draw at the aqrrow
                        ctx.drawImage(stewImage, 133, 110);
                    } else if (realignedStews.length === 2) {
                        // draw at the arrow, a column
                        ctx.drawImage(stewImage, 133, 110 + (45 * i));
                    } else {
                        // draw a polygon shape centered at cx and cy
                        // NOTE: cy can go off the page purposefully
                        const scaling = Math.min((realignedStews.length - 3) / 5, 1);
                        const cx = 160;
                        const cy = 154 + (scaling * 100);
                        const radius = 55 + (scaling * 90);

                        // DISCLOSURE: ai because i dont know angle maths
                        // Calculate the anchor angle from (cx, cy) to the top-left position (133, 110)
                        const targetCenterX = 133 + (stewImage.width / 2);
                        const targetCenterY = 150 + (stewImage.height / 2);
                        const startAngle = Math.atan2(targetCenterY - cy, targetCenterX - cx);
                        
                        // calculate the rotation
                        const rotation = startAngle + ((Math.PI * 2) / realignedStews.length) * i;
                        const x = (radius * Math.cos(rotation)) + cx;
                        const y = (radius * Math.sin(rotation)) + cy;
                        // draw centered there
                        ctx.drawImage(stewImage, x - (stewImage.width / 2), y - (stewImage.height / 2));
                    }
                }

                // done
                return await canvas.toBuffer("image/png");
            };

            // game loop
            createStews();
            let firstTurnEnded = false;
            while (aliveMembers.length > 1) {
                // who's turn is it?
                const lastMemberIdx = aliveMembers.findIndex(member => member.id === activeMember.id);
                const turnMember = aliveMembers.at(lastMemberIdx + 1) || aliveMembers.at(0);
                activeMember = turnMember;
                activeMemberPoisoned = false;

                // render the new image & announce the turn
                gameImageBuffer = await createImage();
                gameImageDirty = true;
                await pushTextLog(`<:greenright:1179996859612282932> **<@${activeMember.id}>**, it's your turn.`);
                await delay(1500);

                // anticipate
                await pushTextLog(`⏰ **<@${activeMember.id}>** tries the stew and...`);
                await delay(2000);

                // try eating the stew
                const stewPoisoned = stews[stewIdx];
                stewsTried[stewIdx] = true;
                if (stewPoisoned) {
                    activeMemberPoisoned = true;
                    aliveMembers.splice(aliveMembers.findIndex(member => member.id === turnMember.id), 1);
                }

                // render & log
                gameImageBuffer = await createImage();
                gameImageDirty = true;
                if (stewPoisoned)
                    await pushTextLog(`💀 **<@${activeMember.id}>** got POISONED!`);
                else
                    await pushTextLog(`✅ **<@${activeMember.id}>** survives!`);
                await delay(3000);

                if (stewPoisoned) {
                    // our poisoned stew was hit, so lets reset the bowls
                    stewIdx = 0;
                    createStews();
                } else {
                    // swap to the next stew, this one's eaten
                    stewIdx += 1;
                }
                firstTurnEnded = true;
            }

            // the last person won
            activeMemberPoisoned = false;
            activeMember = aliveMembers.at(0);
            winningMember = activeMember;

            gameImageBuffer = await createImage();
            gameImageDirty = true;
            
            // update the final log
            await pushTextLog(`👑 **<@${winningMember.id}>** wins!!!`);
        } finally {
            this.activeBattle = null;
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
