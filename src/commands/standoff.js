const discord = require("discord.js");
const crypto = require("crypto");
const { createCanvas, loadImage } = require('@napi-rs/canvas')
const OptionType = require('../util/optiontype');

const delay = (ms) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
};

const standoffFrames = [];
const loadFrames = async () => {
    standoffFrames.push(await loadImage('assets/standoff0001.png'));
    standoffFrames.push(await loadImage('assets/standoff0002.png'));
    standoffFrames.push(await loadImage('assets/standoff0003.png'));
    standoffFrames.push(await loadImage('assets/standoff0004.png'));
    standoffFrames.push(await loadImage('assets/standoff_secret0001.png'));
    standoffFrames.push(await loadImage('assets/standoff_secret0002.png'));
    standoffFrames.push(await loadImage('assets/standoff_secret0003.png'));
    standoffFrames.push(await loadImage('assets/standoff_secret0004.png'));
};
loadFrames();

class Command {
    constructor(client, state) {
        this.name = "standoff";
        this.description = "Challenge another user. One user must shoot the other before the other one can.";
        this.attributes = {
            unlisted: false,
            admin: false,
            lockedToCommands: true,
        };
        this.example = [
            { text: `${state.prefix}standoff @user`, image: "standoff_example1.png" },
        ];

        /**
         * @type {discord.Client}
         */
        this.client = client;
    }

    /**
     * @param {discord.Message} message 
     */
    async invoke(message, _, util) {
        const prefix = util.request("prefix");
        
        const u1 = message.mentions.members.at(0);
        if (!u1) return message.reply(`Ping another user to go against.\nUse **${prefix}help standoff** for more info.`);

        if (util.interactionsBlocked(u1)) {
            if (u1.id !== message.author.id) return message.reply('The user you mentioned has interactions disabled.');
        }

        const activityLog = ['🛑 \`\`Both users must click the reaction to start\`\`'];

        const embed = new discord.MessageEmbed();
        embed.setTitle(`${message.member.displayName} VS. ${u1.displayName}`);
        embed.setDescription(activityLog.join('\n'));

        let isDrawingDirty = false;
        const isSecretEnabled = crypto.randomInt(0, 80) === 0;
        const couldBeSecretIndexPush = isSecretEnabled ? 4 : 0;
        const canvas = createCanvas(standoffFrames[0 + couldBeSecretIndexPush].width, standoffFrames[0 + couldBeSecretIndexPush].height);
        const ctx = canvas.getContext('2d');
        ctx.font = `13px Sans`; // this font loads faster on my laptop :3
        if (isSecretEnabled) {
            ctx.fillStyle = 'white';
        }
        const addText = () => {
            ctx.textAlign = "left";
            ctx.fillText(message.member.displayName, 2, 14, 310 / 2);
            ctx.textAlign = "right";
            ctx.fillText(u1.displayName, 310 - 2, 14, 130);
        };
        ctx.drawImage(standoffFrames[0 + couldBeSecretIndexPush], 0, 0);
        addText();

        // note: i think MessageAttachment has to be used here so that setImage gets the same file name as the buffer
        const attachment = new discord.MessageAttachment(canvas.toBuffer("image/png"), 'standoff.png');
        embed.setImage(`attachment://standoff.png`);

        const messageOptions = {
            embeds: [embed],
            files: [attachment]
        };
        const repliedMessage = await message.reply(messageOptions);
        repliedMessage.react('🛑');

        const updateMessage = () => {
            if (isDrawingDirty) {
                const attachment = new discord.MessageAttachment(canvas.toBuffer("image/png"), 'standoff.png');
                messageOptions.files = [attachment];
                isDrawingDirty = false;
            }
            embed.setDescription(activityLog.join('\n'));
            repliedMessage.edit(messageOptions);
        };
        updateMessage();

        let startTimestamp = Date.now();

        let shootReactionCallbackSatisfied = false;
        /**
         * @param {discord.MessageReaction} reaction 
         * @param {discord.User} user 
         */
        const shootReactionCallback = async (reaction, user) => {
            if (user.id !== u1.id && user.id !== message.member.id) {
                return;
            }
            if (reaction.emoji.name === '💥') {
                // stop listening for reactions
                shootReactionCallbackSatisfied = true;
                this.client.removeListener('messageReactionAdd', shootReactionCallback);
                const authorWon = user.id === message.member.id;
                const frameIndex = authorWon ? 2 : 3;
                ctx.drawImage(standoffFrames[frameIndex + couldBeSecretIndexPush], 0, 0);
                addText();
                isDrawingDirty = true;
                embed.setColor('GREEN');
                const timeDiff = Date.now() - startTimestamp;
                activityLog.push(`<:gold_pengin:1158864673861537864> \`\`${authorWon ? message.member.displayName : u1.displayName} won!\`\` (${timeDiff}ms)`);
                updateMessage();
                // remove reactions
                await repliedMessage.reactions.removeAll();
            }
        };

        let reactionCallbackSatisfied = false;
        /**
         * @param {discord.MessageReaction} reaction 
         */
        const reactionCallback = async (reaction) => {
            if (reaction.message.id !== repliedMessage.id) {
                return;
            }

            const stopReactions = repliedMessage.reactions.cache.get('🛑');
            const reactedUsers = stopReactions.users.cache;
            if (reactedUsers.has(u1.id) && reactedUsers.has(message.member.id)) {
                // BOTH USERS ARE READY
                // stop listening for reactions
                reactionCallbackSatisfied = true;
                this.client.removeListener('messageReactionAdd', reactionCallback);
                // remove reactions
                await repliedMessage.reactions.removeAll();

                const randomTime = crypto.randomInt(700, 2300);
                embed.setColor('DARK_BUT_NOT_BLACK');
                activityLog.push('💬 \`\`Ready...\`\`');
                updateMessage();
                await delay(randomTime);
                // this callback will only check for the fighting users
                // since we are only listening to new reactions on the message,
                // PenguinBot will always win because the reaction of PenguinBot adding the boom reaction
                // is always the first event that this callback will receive
                this.client.on('messageReactionAdd', shootReactionCallback);
                embed.setColor('RED');
                activityLog.push('💥 \`\`Fire!\`\`');
                ctx.drawImage(standoffFrames[1 + couldBeSecretIndexPush], 0, 0);
                addText();
                isDrawingDirty = true;
                updateMessage();
                startTimestamp = Date.now();
                await repliedMessage.react('💥');
                setTimeout(() => {
                    if (!shootReactionCallbackSatisfied) {
                        this.client.removeListener('messageReactionAdd', shootReactionCallback);
                        repliedMessage.reply('No players shot, so the game ended.');
                    }
                }, 5000);
            }
        };
        this.client.on('messageReactionAdd', reactionCallback);
        setTimeout(() => {
            if (!reactionCallbackSatisfied) {
                this.client.removeListener('messageReactionAdd', reactionCallback);
                repliedMessage.reply('One of the 2 users did not join. The game has ended.');
            }
        }, 10000);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
