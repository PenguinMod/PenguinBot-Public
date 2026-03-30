const userid = "1488208752330014951"
let cooldown = 0;

class Command {
    constructor() {
        this.name = "skibout";
        this.description = "lowk time out that skibdidi ipad kid";
        this.attributes = {
            unlisted: false
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
            message.reply("Failed to time out that one skibdidi kid, maybe they are too buzy watching skbidi toilet and left the server to not get distracted on their ipad.");
        });
    }
}

module.exports = Command;
