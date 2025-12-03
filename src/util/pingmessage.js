const Database = require('sync-json-database');
const PingResponseDB = new Database('./databases/ping-responses.json');
const PingResponseChannelsDB = new Database('./databases/ping-res-channels.json');

module.exports = async (message, replyingUserId) => {
    const firstMention = message.mentions.members.first();
    if (!firstMention) return;

    let text = '';
    const loopMembers = message.mentions.members.values();
    for (const member of loopMembers) {
        const userId = member.id;
        if (userId === replyingUserId) continue;
        if (!PingResponseDB.has(`${userId}`)) continue;

        if (PingResponseChannelsDB.has(`${userId}`)) {
            const { type, channels } = PingResponseChannelsDB.get(`${userId}`)
            const isInChannels = channels.includes(message.channel.id) ||
                channels.includes(message.channel.parentId)
            if (type === 'blacklist' && !isInChannels) continue;
            // always assume whitelist if its not a blacklist
            if (type !== 'blacklist' && isInChannels) continue;
        }

        const response = PingResponseDB.get(`${userId}`) || '';
        text += `**${member.user.tag}** currently has a message for people who ping them.\n${response}\n`;
    }

    if (!text) return;
    message.reply({
        content: text.substring(0, 2000),
        allowedMentions: {
            parse: [],
            users: [],
            roles: [],
            repliedUser: true
        }
    });

    return true;
};