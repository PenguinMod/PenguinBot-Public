const configuration = require("../../../config.js");
const Database = require('sync-json-database');
const StarboardCounters = new Database('./databases/starboard-counters.json');
const StarboardMessages = new Database('./databases/starboard-messages.json');
const BaseBotEvent = require("../../../classes/base-bot-event.js");

  // !!! Patch to fix a critical oversite in discord.js that leads to messageReactionRemove never getting fired if the message isnt cached !!!

const MessageReactionRemove = require('discord.js/src/client/actions/MessageReactionRemove.js');
const oldHandle = MessageReactionRemove.prototype.handle;
MessageReactionRemove.prototype.handle = async function(data, fromStructure = false) {
    const channel = this.getChannel(data);
    if (!channel || !channel.isText()) return false;
    await channel.messages.fetch(data.message_id);
    return oldHandle.call(this, data, fromStructure);
}

const env = require("../../../util/env-util.js");

class BotEvent extends BaseBotEvent {
    constructor() {
        super();
        this.listener = "messageReactionRemove";
        this.once = false;

        this.productionOnly = true
    }

    /**
     * 
     * @param {import("discord.js").Client} client 
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
        if (StarboardMessages.get(message.id)) {
            const counts = StarboardCounters.get(StarboardMessages.get(message.id));
            counts.later = subCounts;
            StarboardCounters.saveDataToFile();
            return;
        }
        StarboardCounters.set(message.id, subCounts);
    }
}

module.exports = BotEvent;
