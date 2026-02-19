const userid = "1335093086115860552"

class Command {
    constructor() {
        this.name = "timeoutkppkaung";
        this.description = "Times out kppkaung when he's too annoying";
        this.attributes = {
            unlisted: false,
            permission: 0
        };
    }

    invoke(message) {
        message.guild.members.fetch(userid).then((target) => {
            target.timeout(5 * 60 * 1000, `Performed via penguinbot by ${message.author.globalName}`);
            message.reply(`Timed out ${target.displayName} for 5 minutes`);
        })
        .catch((error) => {
            message.reply("Failed to time out user, maybe they left.");
        });
    }
}

module.exports = Command;