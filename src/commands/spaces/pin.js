class Command {
    constructor() {
        this.name = "pin";
        this.description = "Pins a message in your <#1181097377730400287>. Use \"remove\" as a parameter to remove a pin.";
        this.attributes = {
            unlisted: false,
            admin: false,
            spaceOwner: true,
        };
    }

    async invoke(message, args, util) {
        const reply = await util.getReply(message);
        if (!reply) return message.reply('You need to reply to a message to pin it.');
        if (reply.channel.id !== message.channel.id) return;
        if (args[0] === 'remove') {
            reply.unpin(`Requested by space owner ${message.member.displayName ?? ""}`);
        } else {
            reply.pin(`Requested by space owner ${message.member.displayName ?? ""}`);
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;