const axios = require('axios');
const discord = require("discord.js");
const PenguinModClient = require("../../util/penguinmod-client");
const OptionType = require('../../util/optiontype');

const safeNumber = (num) => {
    const number = Number(num);
    if (isNaN(number)) return 0;
    return number;
};
const unixToDisplayDate = (unix) => {
    unix = Number(unix);
    return `${new Date(unix).toLocaleString([], {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true
    })}`;
}

class Command {
    constructor() {
        this.name = "random";
        this.description = "Gets a random PenguinMod project.";
        this.attributes = {
            unlisted: false,
            admin: false,
            lockedToCommands: true,
        };
        this.slash = {
            options: []
        };
    }

    convertSlashCommand(interaction) {
        return [interaction];
    }

    async invoke(message) {
        // TODO: implement getrandomproject in PenguinMod-ApiModule instead, since this fetches the project twice
        const response = await axios.get('https://projects.penguinmod.com/api/v1/projects/getrandomproject');
        const project = await PenguinModClient.projects.getProjectMeta(response.data.id);

        // make the embed
        // TODO: Maybe this should be a util module, like makeProjectEmbed(project);
        let extraFlags = [];
        const embed = new discord.MessageEmbed();
        embed.setTitle(project.title);

        // set color & extra flags
        embed.setColor("#00c3ff");
        if (project.remix && String(project.remix) !== "0") {
            extraFlags.push(`<:greenright:1179996859612282932> [This project is a remix.](https://studio.penguinmod.com/#${project.remix})`);
            embed.setColor("#00ff00");
        }
        if (project.featured) {
            extraFlags.push('<:favorite:1158864719764017212> This project is featured!');
            embed.setColor("#ffcc00");
        }

        embed.setImage(`${PenguinModClient.apiUrl}/v1/projects/getproject?projectID=${project.id}&requestType=thumbnail`);

        const fullText = `${project.instructions}\n\n${project.notes}`;
        const fullTextToolong = fullText.length > 512;
        const description = fullTextToolong ? fullText.substring(0, 512 - 3) + '...' : fullText.substring(0, 512);
        embed.setDescription(extraFlags.length > 0 ? `${description}\n\n${extraFlags.map(value => (`**${value}**`)).join('\n')}` : description);
        embed.addFields([
            {
                name: "Stats",
                value: `❤️ ${safeNumber(project.loves)
                    } | ⭐ ${safeNumber(project.votes)
                    } | 👁️ ${safeNumber(project.views)
                    }`
            }
        ]);

        const numberDate = Number(project.date);
        const projectDate = `${new Date(numberDate).toDateString()} at ${new Date(numberDate).toLocaleTimeString()}`;
        embed.setFooter({
            text: `Uploaded on ${projectDate}\nMake sure to report inappropriate/offensive content!`
        });
        embed.setURL(`https://studio.penguinmod.com/#${project.id}`);

        message.reply({
            embeds: [embed]
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
