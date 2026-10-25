const discord = require("discord.js");

const { Jimp, JimpMime } = require('jimp');

const OptionType = require('../util/optiontype.js');
const ProgressBar = require('../util/progress-bar.js');
const BaseCommand = require("../classes/basecommand.js");
const DiscordUtility = require("../util/utility-discord.js");

// define ratings from highest to smallest
// try not to duplicate the same numbers in different ranges, but the highest in the array is used first if duplicates exist
const compatibilityRatings = [
    {
        range: [1000, Infinity],
        rating: 'i would like an explanation... <a:kirby_bounce:1530758702003392522><a:kirby_bounce:1530758702003392522><:explain:1530846205469528205>',
        ratingImage: './assets/heart_strong.png'
    },
    {
        range: [300, 1000],
        rating: 'WHAT THE GYATT!!1!11!111!!!!! <a:kirby_bounce:1530758702003392522><a:dancefast:1530846947869724792><a:breakdance:1530758830752010382><a:kirby_bounce:1530758702003392522><:explain:1530846205469528205>',
        ratingImage: './assets/heart_strong.png'
    },
    {
        range: [100, 300],
        rating: 'literally perfect <a:kirby_bounce:1530758702003392522><a:kirby_bounce:1530758702003392522><a:kirby_bounce:1530758702003392522>',
        ratingImage: './assets/heart_strong.png'
    },
    {
        range: [97, 99],
        rating: 'holy shiet <a:breakdance:1530758830752010382><a:dancefast:1530846947869724792><a:breakdance:1530758830752010382>',
        ratingImage: './assets/heart_strong.png'
    },
    {
        range: [90, 96],
        rating: 'nearly the perfect one <a:dancefast:1530846947869724792>',
        ratingImage: './assets/heart_strong.png'
    },
    {
        range: [79, 89],
        rating: 'oh my goodness <:cat_yay:1530846336864489583>',
        ratingImage: './assets/heart_pulsating.png'
    },
    {
        range: [68, 78],
        rating: 'there is a possibility',
        ratingImage: './assets/heart_pulsating.png'
    },
    {
        range: [51, 67],
        rating: '<:whan:1530846371631075480>',
        ratingImage: './assets/heart.png'
    },
    {
        range: [38, 50],
        rating: 'somethin starting here <:blue_think:1530846623595495524>',
        ratingImage: './assets/heart.png'
    },
    {
        range: [30, 37],
        rating: 'well, its not bad',
        ratingImage: './assets/heart.png'
    },
    {
        range: [21, 29],
        rating: 'max friend zone',
        ratingImage: './assets/heart_cracked.png'
    },
    {
        range: [11, 20],
        rating: 'just friends pal',
        ratingImage: './assets/heart_cracked.png'
    },
    {
        range: [1, 10],
        rating: 'mmm, not good',
        ratingImage: './assets/heart_broken.png'
    },
    {
        range: [-Infinity, 0],
        rating: '<:bruhskull:1530846295424634923>',
        ratingImage: './assets/gun.png'
    },
];

// rig ratings by ID -> compatibilities
// NOTE: for simplicity, please define all the ratings in riggedRatingsMap as seen below
// NOTE: When you use duplicates it assumes that all of them together should have the same compatibility level with eachother
const riggedRatings = {};
const riggedRatingsMap = new Map();
riggedRatingsMap.set([
    "462098932571308033", // jeremygamer13
    "462098932571308033", // jeremygamer14
    "738358663168786432", // penguinbot
    "830907566455783493", // penguinbot testing
    "740656196658397319", // penguinai
    "750860494197227632", // jeremy stream bot
], {
    // evil proshipping
    "700139995125776505": 0, // jeremygamer14
    "738358663168786432": 0, // penguinbot
    "830907566455783493": 0, // penguinbot testing
    "740656196658397319": 0, // penguinai
    "750860494197227632": 0, // jeremy stream bot
});
// mubilop
riggedRatingsMap.set(["1160426569156808734"], {
    "989439473223888957": 100, // starlight
});
// ddede
riggedRatingsMap.set(["694587798598058004"], {
    "598606736148135937": 300, // puzzlinGG
});
// cube
riggedRatingsMap.set(["1033131187901841478"], {
    "1063935325761716224": 1000, // mason
});
// NOTE: this is just turning these rigged ratings into a simple lookup table
// NOTE: We also need to make each ID point back to the host user with the same compatibility (ex, dde to puzz and puzz to dde are both 300)
// DISCLOSURE: This segment is ai because Hooly shit this is so complicated
for (const [keys, ratings] of riggedRatingsMap.entries()) {
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (!riggedRatings[key]) {
            riggedRatings[key] = {};
        }

        for (let j = 0; j < keys.length; j++) {
            const otherKey = keys[j];
            if (key !== otherKey) {
                riggedRatings[key][otherKey] = ratings[otherKey] !== undefined ? ratings[otherKey] : 0;
            }
        }

        for (const targetKey in ratings) {
            if (Object.prototype.hasOwnProperty.call(ratings, targetKey)) {
                riggedRatings[key][targetKey] = ratings[targetKey];
            }
        }
    }

    for (const targetKey in ratings) {
        if (Object.prototype.hasOwnProperty.call(ratings, targetKey)) {
            const score = ratings[targetKey];
            if (!riggedRatings[targetKey]) {
                riggedRatings[targetKey] = {};
            }

            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                riggedRatings[targetKey][key] = score;
            }
        }
    }
}

// more functions noow
const mixNames = (user1, user2) => {
    const string1 = String(user1.displayName ?? user1);
    const string2 = String(user2.displayName ?? user2);
    const halfLeng1 = Math.floor(string1.length / 2);
    const halfLeng2 = Math.ceil(string2.length / 2);
    const cutString1 = string1.substring(0, halfLeng1);
    const cutString2 = string2.substring(halfLeng2, string2.length);
    const mixedName = cutString1 + cutString2;

    // one guy is named "nice" the other is named "lotbigger"
    if (!DiscordUtility.automodAllows(mixedName, true)) {
        return `${string1} + ${string2}`;
    }
    
    return mixedName;
};
const getRiggedRating = (user1, user2) => {
    const riggedCompatibilities = riggedRatings[user1.id] || {};
    const riggedCompatibility = riggedCompatibilities[user2.id];
    if (typeof riggedCompatibility === "number")
        return riggedCompatibility;
};
const generateCompatibility = (user1, user2) => {
    if (typeof user1 !== "string") {
        const riggedCompatibility = getRiggedRating(user1, user2);
        if (typeof riggedCompatibility === "number")
            return Math.round(riggedCompatibility);
    }
    if (typeof user2 !== "string") {
        const riggedCompatibility = getRiggedRating(user2, user1);
        if (typeof riggedCompatibility === "number")
            return Math.round(riggedCompatibility);
    }

    // ok we actually have to acalcualte it lo0l
    if (typeof user1 === 'string') {
        user1 = user1.split('').map(letter => letter.charCodeAt(0)).join('');
    } else {
        user1 = user1.id;
    }
    if (typeof user2 === 'string') {
        user2 = user2.split('').map(letter => letter.charCodeAt(0)).join('');
    } else {
        user2 = user2.id;
    }

    // Extract first 7 characters of user IDs
    const idSub1 = user1.substring(0, 7);
    const idSub2 = user2.substring(0, 7);

    // Convert first 7 characters to numbers
    const num1 = parseInt(idSub1);
    const num2 = parseInt(idSub2);

    // New meth
    const compatibility = Math.abs(((num1 * num2) ^ (num1 + num2)) % 101);
    return Math.max(0, Math.min(Math.round(compatibility), 100));
};
const getRatingInfo = (rating = 0) => {
    for (const ratingInfo of compatibilityRatings) {
        if (rating >= ratingInfo.range[0] && rating <= ratingInfo.range[1])
            return ratingInfo;
    }

    throw new Error("No compatibilityRatings contain the specified rating;" + rating);
};

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "ship";
        this.description = "See the compatibility of two users.";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };
        this.example = [{
                text: `{{prefix}}ship @user1 @user2`,
                image: "ship_example1.png"
            },
            {
                text: `{{prefix}}ship @user`
            },
            {
                text: `{{prefix}}ship any_text_you_want another_piece_of_text`
            },
        ];
        this.slash = {
            options: [{
                type: OptionType.STRING,
                name: 'user1',
                required: true,
                description: 'User ping, or text.'
            }, {
                type: OptionType.STRING,
                name: 'user2',
                required: false,
                description: 'User ping, or text.'
            }]
        };
    }

    async convertSlashCommand(interaction, util) {
        const u1 = interaction.options.getString('user1');
        const u2 = interaction.options.getString('user2');

        const convertedMember1 = (await DiscordUtility.resolveMention(u1)) || null;
        const convertedMember2 = (await DiscordUtility.resolveMention(u2)) || null;

        interaction.author = interaction.member.user;
        interaction.mentions = {
            members: {
                at: (idx) => {
                    if (idx === 1) return convertedMember2;
                    return convertedMember1;
                }
            }
        };
        interaction.edit = interaction.editReply;
        return [interaction, [u1, u2], util];
    }

    async invoke(message, args, util) {
        let u1 = message.mentions.members.at(0) ?? ((await DiscordUtility.resolveMention(args[0])) || args[0] || message.member);
        let u2 = message.mentions.members.at(1) ?? ((await DiscordUtility.resolveMention(args[1])) || args[1] || message.member);
        // We cant resolve these to anything, not even just text
        if (!(u1 && u2)) {
            message.reply('You must mention 2 people.');
            return;
        }

        // NOTE: u1 or u2 can be text
        if (u1.id && !util.canInteract(u1))
            return message.reply('The user you mentioned has interactions disabled.');
        if (u2.id && !util.canInteract(u2))
            return message.reply('The user you mentioned has interactions disabled.');

        // resort u1 to u2 if they are out of order
        // NOTE: this looks ugly because its a string and a > op but its the same as .sort() for this purpose
        if ((u1.id ?? u1) > (u2.id ?? u2))
            [u1, u2] = [u2, u1];

        // generate embed info
        const compatibility = generateCompatibility(u1, u2);
        const ratingInfo = getRatingInfo(compatibility);
        const progressBar = ProgressBar('pink', 10, compatibility);

        // add to embed with that ratingInfo
        const embed = new discord.MessageEmbed();
        embed.setColor('#FE81D2');
        embed.setDescription(`<:shuffle_ship:1180022485350096926> **${mixNames(u1, u2)}**`
            + "\n" + `${compatibility}% ${progressBar} ${ratingInfo.rating}`);
        embed.setFooter({
            text: `Requested by ${message.author.tag}`,
            iconURL: util.avatarURL({ format: 'png' })
        });

        // generate image of the two  users and the ratingInfo.ratingImage
        const jimpImage = new Jimp({ width: 292, height: 128 });
        const userImage1Url = (typeof u1 === "string" ? null : DiscordUtility.avatarURL(u1)) ?? './assets/pink_default.jpg';
        const userImage2Url = (typeof u2 === "string" ? null : DiscordUtility.avatarURL(u2)) ?? './assets/pink_default.jpg';
        const userImage1 = await Jimp.read(userImage1Url);
        const userImage2 = await Jimp.read(userImage2Url);
        const maskImage = await Jimp.read('./assets/mask_ship.png');
        const ratingImage = await Jimp.read(ratingInfo.ratingImage);
        userImage1.resize({ w: 128, h: 128 });
        userImage2.resize({ w: 128, h: 128 });
        jimpImage.composite(userImage1, 0, 0);
        jimpImage.composite(userImage2, 292 - 128, 0);
        jimpImage.mask(maskImage, 0, 0);
        jimpImage.composite(ratingImage, 146 - (ratingImage.width / 2), 64 - (ratingImage.height / 2));

        // add to embed
        // NOTE: i think MessageAttachment has to be used here so that setImage gets the same file name as the buffer
        const buffer = await jimpImage.getBuffer(JimpMime.png);
        const attachment = new discord.MessageAttachment(buffer, 'ship.png');
        embed.setImage(`attachment://ship.png`);
        message.reply({
            content: `💟 **the fabled perfect ship?** 💟`
                + "\n" + `🔻 *\`\`${String(u1.displayName ?? u1)}\`\`*`
                + "\n" + `🔺 *\`\`${String(u2.displayName ?? u2)}\`\`*`,
            files: [attachment],
            embeds: [embed],
            allowedMentions: { // ping NO ONE. this can DEFINETLY be abused if we did allow pings
                parse: [],
                users: [],
                roles: [],
                repliedUser: true
            }
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;