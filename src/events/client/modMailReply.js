const Database = require('sync-json-database');
const ModMailDB = new Database('./databases/anonymous-modmail-db.json');
const CommandUtility = require("../../util/utility.js");

const discord = require("discord.js");

class BotEvent {
    constructor(client) {
        this.listener = "messageCreate";
        this.once = false;

        this.client = client;
    }

    async userRepliedToMod(message) {
        const messageContent = `${message.content}`;
        const displayImage = message.author.avatarURL({ format: 'png' });
        const embedForLog = new discord.MessageEmbed();
        embedForLog.setTitle("Replied to Moderator Message");
        embedForLog.setColor("#34eb4c");
        embedForLog.setDescription(messageContent);
        embedForLog.addFields([{ name: "Sent from", value: `${message.author}` }]);
        embedForLog.setAuthor({ name: message.author.username, iconURL: displayImage });
        embedForLog.setFooter({ text: "Reply to this message to respond." });
        const modTipReportChannel = this.client.channels.cache.get('1255097127600656484');
        const loggedMessage = await modTipReportChannel.send({
            embeds: [embedForLog],
            allowedMentions: {
                parse: [],
                users: [],
                roles: [],
                repliedUser: false
            }
        });

        message.reply("Your reply was sent. You can reply to the original message again to send another message until the moderators respond again.");
        ModMailDB.set("NeedsReply" + loggedMessage.id, message.author.id);
    }
    async modRepliedToUser(message, target) {
        // confirm this is a final reply
        // big section here but we just make a yes or no prompt basically and wait until its responded to or times out
        const buttonRow = [
            new discord.MessageActionRow().addComponents([
                new discord.MessageButton({
                    customId: 'yes',
                    style: 'PRIMARY',
                    label: "Send as reply",
                }),
                new discord.MessageButton({
                    customId: 'no',
                    style: 'DANGER',
                    label: "Do not send",
                })
            ])
        ];
        /**
         * @type {discord.Message}
         */
        const confirmationMessage = await message.reply({
            content: "Do you want to reply to this user with your message?",
            components: buttonRow,
        });
        const collector = confirmationMessage.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 180000 // 3 minutes
        });
        const confirmed = await new Promise((resolve) => {
            collector.on('collect', async (i) => {
                if (i.customId === "no") {
                    resolve(false);
                } else if (i.customId === "yes") {
                    resolve(true);
                }
            });
            collector.on('dispose', () => {
                resolve(false);
            });
            collector.on('end', () => {
                resolve(false);
            });
        });
        if (!confirmed) return confirmationMessage.edit({ content: "Cancelled this reply.", components: [] });
        confirmationMessage.edit({ content: "Sent reply.", components: [] });

        // send the reply
        const tipMessage = `${message.content}`;
        const displayImage = message.author.avatarURL({ format: 'png' });

        // create a log embed
        const embedForLog = new discord.MessageEmbed();
        embedForLog.setTitle("Moderator Tip Sent as Reply");
        embedForLog.setColor("#ffcd03");
        embedForLog.setDescription(tipMessage);
        embedForLog.addFields([{ name: "Sent as reply to", value: `${target}` }]);
        embedForLog.setAuthor({ name: message.author.username, iconURL: displayImage });
    
        // create the user DM
        // NOTE: Discord does not seem to provide a way to check whether or not you can DM someone, so we just try to send this DM.
        const embedForDM = new discord.MessageEmbed();
        embedForDM.setTitle("Anonymous Reply");
        embedForDM.setColor("#ffcd03");
        embedForDM.setDescription(`**This is a response to your reply from a previous anonymous tip.**\n**Moderator Message**:\n${tipMessage}\n\nPlease **REPLY to THIS MESSAGE** to respond.`);
        let canDMUser = true;
        let dmedMessage = null;
        try {
            dmedMessage = await target.send({
                embeds: [embedForDM],
                allowedMentions: {
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: false
                }
            });
            ModMailDB.set("DMReply" + target.id, dmedMessage.id);
        } catch {
            canDMUser = false;
        }
        
        embedForLog.setFooter({ text: `Sent by ${message.author.username} | ${canDMUser ? "Sent to user's DM" : "Could not be sent to the user!"}` });
        const modTipReportChannel = this.client.channels.cache.get('1255097127600656484');
        modTipReportChannel.send({
            embeds: [embedForLog],
            allowedMentions: {
                parse: [],
                users: [],
                roles: [],
                repliedUser: false
            }
        });
    }
    async invoke(client, state, message) {
        // ignore bots
        if (!message.author) return;
        if (message.author.bot) return;
        if (message.author.system) return;
        if (message.system) return;

        // check if this is a reply
        let isReply = message.reference && message.reference.messageId;
        if (!isReply) return;
        
        const authorId = message.author.id;
        const replyId = message.reference.messageId;

        // if a dm, handle like user replied to mod
        if (message.channel.type === "DM") {
            // if this is a reply, make sure we are replying to the latest mod mail message
            if (ModMailDB.get("DMReply" + authorId) !== replyId) return;
            this.userRepliedToMod(message);
            return;
        }

        // this is a regular text channel, check if modmail db has this message & they are mod
        if (!ModMailDB.has("NeedsReply" + replyId)) return;
        if (CommandUtility.getPermissionLevel(message) < 2) return;
        const warnedAuthorId = ModMailDB.get("NeedsReply" + replyId);
        const warnedAuthor = await this.client.users.fetch(warnedAuthorId);
        this.modRepliedToUser(message, warnedAuthor);
    }
}

module.exports = BotEvent;