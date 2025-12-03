const Database = require('sync-json-database');
const ModMailDB = new Database('./databases/anonymous-modmail-db.json');

const { MessageEmbed } = require("discord.js");

class Command {
    constructor(client) {
        this.name = "modtip";
        this.description = "Send an anonymous message to a member in the server. Will be logged to other mods, and the user can reply back.";
        this.attributes = {
            unlisted: true,
            permission: 2,
            lockedToChannels: [
                '1176024649390366780',
                '1038252107846930513',
                '1255097127600656484',
                '1139749855913316474'
            ],
        };
        
        this.client = client;
    }

    async invoke(message, args) {
        const moderator = message.author;
        const moderatorDisplayImage = moderator.avatarURL({ format: 'png' });
        const mentionedMember = message.mentions.members.at(0) ?? args[0];
        if (!mentionedMember) return message.reply("Please mention a member to send a tip to.");

        args.shift(); // remove the mention
        const tipMessage = args.join(" ").trim();
        if (!tipMessage) return message.reply("Please add a message to send to the user.");
        if (tipMessage.length > 2048) return message.reply("The message is too long. Please shorten it.");
        
        // create a log embed
        const embedForLog = new MessageEmbed();
        embedForLog.setTitle("Moderator Tip Sent");
        embedForLog.setColor("#ffcd03");
        embedForLog.setDescription(tipMessage);
        embedForLog.addFields([{ name: "Sent to", value: `${mentionedMember}` }]);
        embedForLog.setAuthor({ name: moderator.displayName, iconURL: moderatorDisplayImage });

        // create the user DM
        // NOTE: Discord does not seem to provide a way to check whether or not you can DM someone, so we just try to send this DM.
        const embedForDM = new MessageEmbed();
        embedForDM.setTitle("Anonymous Tip");
        embedForDM.setColor("#ff0000");
        embedForDM.setDescription(`**You've received a moderator message from PenguinMod's Discord server.**\nBe careful in the future to follow the rules of the PenguinMod community.\n\n**Moderator Message**:\n${tipMessage}\n\nPlease **REPLY to THIS MESSAGE** to respond.`);
        let canDMUser = true;
        let dmedMessage = null;
        try {
            dmedMessage = await mentionedMember.send({
                embeds: [embedForDM],
                allowedMentions: {
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: false
                }
            });
            ModMailDB.set("DMReply" + mentionedMember.id, dmedMessage.id);
        } catch {
            canDMUser = false;
        }
        
        embedForLog.setFooter({ text: `Sent by ${moderator.displayName} | ${canDMUser ? "Sent to user's DM" : "Could not be sent to the user!"}` });

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
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;