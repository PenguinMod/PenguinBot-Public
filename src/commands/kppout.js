const userid = "1322415872777912350"
let cooldown = 0;

class Command {
    constructor() {
        this.name = "kppout";
        this.description = "Times out kppkaung when he's too annoying";
        this.attributes = {
            unlisted: true,
            permission: 3
        };
    }

    invoke(message) {
        if (Date.now() - cooldown < (5 * 60 * 1000)) {
            return message.reply(`On cooldown (expires <t:${Math.round(cooldown / 1000 + 5 * 60)}:R>)`);
        }
        cooldown = Date.now();

        message.guild.members.fetch(userid).then((target) => {
            target.timeout(60 * 1000, `Performed via penguinbot by ${message.author.globalName}`);
            message.reply(`Timed out ${target.displayName} for 1 minute.`);
        })
        .catch((error) => {
            message.reply("Failed to time out user, maybe they left.");
        });
    }
}

module.exports = Command;