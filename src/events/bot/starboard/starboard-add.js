const configuration = require("../../../config.js");
const Database = require('sync-json-database');
const StarboardCounters = new Database('./databases/starboard-counters.json');
const StarboardMessages = new Database('./databases/starboard-messages.json');
const { BaseMessageComponent } = require('discord.js');
const { MessageComponentTypes, Events } = require('discord.js/src/util/Constants');
const BaseBotEvent = require("../../../classes/base-bot-event.js");

      // !!! This is a patch to force V13 to pass newer components along to discord !!!

BaseMessageComponent.create = function create(data, client) {
    let component;
    let type = data.type;

    if (typeof type === 'string') type = MessageComponentTypes[type];

    switch (type) {
      case MessageComponentTypes.ACTION_ROW: {
        const {MessageActionRow} = require('discord.js');
        component = data instanceof MessageActionRow ? data : new MessageActionRow(data, client);
        break;
      }
      case MessageComponentTypes.BUTTON: {
        const {MessageButton} = require('discord.js');
        component = data instanceof MessageButton ? data : new MessageButton(data);
        break;
      }
      case MessageComponentTypes.SELECT_MENU: {
        const {MessageSelectMenu} = require('discord.js');
        component = data instanceof MessageSelectMenu ? data : new MessageSelectMenu(data);
        break;
      }
      case MessageComponentTypes.TEXT_INPUT: {
        const {TextInputComponent} = require('discord.js');
        component = data instanceof TextInputComponent ? data : new TextInputComponent(data);
        break;
      }
      default:
        component = { toJSON() { return data } };
        break;
    }
    return component;
  }

  // !!! Patch to fix a critical oversite in discord.js that leads to messageReactionAdd never getting fired if the message isnt cached !!!

const MessageReactionAdd = require('discord.js/src/client/actions/MessageReactionAdd.js');
const oldHandle = MessageReactionAdd.prototype.handle;
MessageReactionAdd.prototype.handle = async function(data, fromStructure = false) {
    const channel = this.getChannel(data);
    if (!channel || !channel.isText()) return false;
    await channel.messages.fetch(data.message_id);
    return oldHandle.call(this, data, fromStructure);
}

const env = require("../../../util/env-util.js");

class BotEvent extends BaseBotEvent {
    constructor() {
        super();
        this.listener = "messageReactionAdd";
        this.once = false;

        this.productionOnly = true
    }

    /**
     * 
     * @param {object} state 
     * @param {import("discord.js").MessageReaction} reaction 
     * @param {import("discord.js").GuildMember} member 
     * @returns 
     */
    async invoke(reaction, member) {
        if (!env.getBool("MANAGE_MESSAGE_STARBOARD"))
            return;
        if (reaction.message.guild.id !== env.get("SERVER_ID"))
            return;

        let count = 0;
        const message = reaction.message;
        const subCounts = { author: message.author.id, channel: message.channel.id };
        for (const emoji of configuration.starboardEmojis) {
            const reaction = message.reactions.resolve(emoji);
            if (!reaction) continue;
            const users = await reaction.users.fetch();
            const subCount = users.filter(user => user.id !== this.client.user.id).size;
            subCounts[emoji] = subCount;
            count += subCount;
        }
        if (count <= 0) return;
        if (StarboardMessages.get(message.id) && StarboardCounters.get(StarboardMessages.get(message.id))) {
            const counts = StarboardCounters.get(StarboardMessages.get(message.id));
            counts.later = subCounts;
            StarboardCounters.saveDataToFile();
            return;
        }
        StarboardCounters.set(message.id, subCounts);

        if (count >= configuration.starboardAt && !StarboardMessages.get(message.id)) {
            const starboard = await this.client.channels.fetch(configuration.channels.starboard);
            const media = reaction.message.attachments
                .filter(attachment => attachment.contentType?.startsWith?.('image') || attachment.contentType?.startsWith?.('video'))
            const files = reaction.message.attachments
                .filter(attachment => !attachment.contentType?.startsWith?.('image') && !attachment.contentType?.startsWith?.('video'))
            const msg = await starboard.send({
                flags: 1 << 15,
                components: [
                    {
                        type: 17,
                        components: [
                            {
                                type: 9,
                                components: [
                                    { type: 10, content: `## ${reaction.message.member.displayName}` },
                                    reaction.message.content && { type: 10, content: `${reaction.message.content}` }
                                ].filter(Boolean),
                                accessory: {
                                    type: 11,
                                    media: { url: reaction.message.member.avatarURL() ?? reaction.message.author.avatarURL() },
                                    description: reaction.message.author.username,
                                    spoiler: false
                                }
                            },
                            media.size > 0 && {
                                type: 12,
                                items: media.map(attachment => ({
                                    media: { url: attachment.url },
                                    name: attachment.name,
                                    description: attachment.description,
                                    spoiler: attachment.spoiler
                                }))
                            },
                            files.size > 0 && 
                                files.map(attachment => ({
                                    type: 13,
                                    file: { url: `attachment://${attachment.name}` },
                                    name: attachment.name,
                                    description: attachment.description,
                                    spoiler: attachment.spoiler
                                })), 
                            {
                                type: 10,
                                id: 0xDEED,
                                content: `-# ${reaction.message.author.username} Posted <t:${Math.floor(reaction.message.createdTimestamp / 1000)}:R> (${reaction.message.id})`
                            }
                        ].flat().filter(Boolean),
                        accent_color: undefined,
                        spoiler: false
                    }
                ],
                files: files.toJSON()
            });
            msg.react(configuration.starboardEmojis[0]);
            StarboardMessages.set(msg.id, message.id);
            StarboardMessages.set(message.id, msg.id);
        }
    }
}

module.exports = BotEvent;
