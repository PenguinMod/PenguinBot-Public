const { Jimp: jimp, JimpMime } = require('jimp');
const discord = require("discord.js");

const OptionType = require('../util/optiontype');
const ProgressBar = require('../util/progress-bar');

const config = {
    titleText: ':heart_decoration: **the fabled perfect ship?** :heart_decoration:',
    embedColor: '#FE81D2',
    
    nameShuffleEmoji: '<:shuffle_ship:1180022485350096926>',
    pointDown: ':small_red_triangle_down:',
    pointUp: ':small_red_triangle:',

    compatibilityRatings: {
        300: {
            rating: 'WHAT THE GYATT!!1!11!111!!!!! <:excusemewhat:1117472083081969714><:excusemewhat:1117472083081969714><:excusemewhat:1117472083081969714><:excusemewhat:1117472083081969714><:explain:1121205574017744896><:explain:1121205574017744896><:explain:1121205574017744896><:excusemewhat:1117472083081969714><:explain:1121205574017744896>',
            ratingImage: './assets/heart_strong.png'
        },
        1000: {
            rating: 'i would like an explanation... <:explain:1121205574017744896><:explain:1121205574017744896><:explain:1121205574017744896>',
            ratingImage: './assets/heart_strong.png'
        },
        100: {
            rating: 'literally perfect <a:kirby_bounce:1164825362384027719> <a:kirby_bounce:1164825362384027719>',
            ratingImage: './assets/heart_strong.png'
        },
        0: {
            rating: '<:bruhskull:1164827366841913375>',
            ratingImage: './assets/gun.png'
        }
    },
    lowerBoundRatings: [{
            max: 10,
            rating: 'mmm, not good',
            ratingImage: './assets/heart_broken.png'
        },
        {
            max: 20,
            rating: 'just friends pal',
            ratingImage: './assets/heart_cracked.png'
        },
        {
            max: 29,
            rating: 'max friend zone',
            ratingImage: './assets/heart_cracked.png'
        },
        {
            max: 37,
            rating: 'well, its not bad',
            ratingImage: './assets/heart.png'
        },
        {
            max: 50,
            rating: 'somethin starting here <a:breakdance:1158859411616432189>',
            ratingImage: './assets/heart.png'
        },
        {
            max: 67,
            rating: '<:whan:1164843942735519774>',
            ratingImage: './assets/heart.png'
        },
        {
            max: 78,
            rating: 'there is a possibility',
            ratingImage: './assets/heart_pulsating.png'
        },
        {
            max: 89,
            rating: 'oh my goodness <:cat_yay:1164834611667419246>',
            ratingImage: './assets/heart_pulsating.png'
        },
        {
            max: 96,
            rating: 'nearly the perfect one <:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:1178472314556391424>',
            ratingImage: './assets/heart_strong.png'
        },
        {
            max: 100,
            rating: 'holy shiet <a:breakdance:1158859411616432189>',
            ratingImage: './assets/heart_strong.png'
        }
    ],
    customRatings: [{
            users: ['694587798598058004', '598606736148135937'], // ddede and puzzlinGG
            compatibility: 300
        },
        {
            users: ['1033131187901841478', '1063935325761716224'], // cube and mason
            compatibility: 1000
        },
        {
            users: ['989439473223888957', '1160426569156808734'],
            compatibility: 100
        }
    ]
};

const mixNames = (user1, user2) => {
    const string1 = String(user1.displayName ?? user1);
    const string2 = String(user2.displayName ?? user2);
    const halfLeng1 = Math.floor(string1.length / 2);
    const halfLeng2 = Math.ceil(string2.length / 2);
    const cutString1 = string1.substring(0, halfLeng1);
    const cutString2 = string2.substring(halfLeng2, string2.length);
    return cutString1 + cutString2;
};
const stringAddNames = (user1, user2) => {
    const string1 = String(user1.displayName ?? user1);
    const string2 = String(user2.displayName ?? user2);
    return `${string1} + ${string2}`;
};

const generateCompatibility = (user1, user2) => {
    const userIds = [user1.id, user2.id].sort();
    const customRating = config.customRatings.find(rating => rating.users.includes(userIds[0]) && rating.users.includes(userIds[1]));

    if (customRating) {
        return customRating.compatibility;
    }

    if (typeof user1 === 'string') {
        user1 = {
            id: user1.split('').map(letter => letter.charCodeAt(0)).join('')
        };
    }
    if (typeof user2 === 'string') {
        user2 = {
            id: user2.split('').map(letter => letter.charCodeAt(0)).join('')
        };
    }

    // Extract first 7 characters of user IDs
    const idSub1 = user1.id.substring(0, 7);
    const idSub2 = user2.id.substring(0, 7);

    // Convert first 7 characters to numbers
    const num1 = parseInt(idSub1);
    const num2 = parseInt(idSub2);

    // New meth
    const compatibility = ((num1 * num2) ^ (num1 + num2)) % 101;

    return Math.abs(compatibility);
};

const getUserAvatar = (user) => {
    if (typeof user === 'string') return undefined;
    const options = {
        format: 'png'
    };
    return user.avatarURL(options) ?? user.user.avatarURL(options);
}

class Command {
    constructor(_, state) {
        this.name = "ship";
        this.description = "See the compatibility of two users.";
        this.attributes = {
            unlisted: false,
            admin: false,
            lockedToCommands: true,
        };
        this.example = [{
                text: `${state.prefix}ship @user1 @user2`,
                image: "ship_example1.png"
            },
            {
                text: `${state.prefix}ship @user`
            },
            {
                text: `${state.prefix}ship any_text_you_want another_piece_of_text`
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

    async convertMentionToUser(string, guild) {
        string = String(string).trim();
        if (!string.startsWith('<@')) return false;
        if (!string.endsWith('>')) return false;
        string = string.substring(2, string.length - 1)
        const num = Number(string);
        if (isNaN(num)) return false;
        let user = false;
        try {
            user = await guild.members.fetch(string);
        } catch {
            user = false;
        }
        if (!user) return false; // in the epico case that user is null
        return user;
    }

    async convertSlashCommand(interaction, util) {
        const u1 = interaction.options.getString('user1');
        const u2 = interaction.options.getString('user2');

        const convertedMember1 = (await this.convertMentionToUser(u1, interaction.guild)) || null;
        const convertedMember2 = (await this.convertMentionToUser(u2, interaction.guild)) || null;

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
        const u1 = message.mentions.members.at(0) ?? (args[0] ? args[0] : message.member);
        const u2 = message.mentions.members.at(1) ?? (args[1] ? args[1] : message.member);
        const string1 = String(u1.displayName ?? u1);
        const string2 = String(u2.displayName ?? u2);

        if (!(u1 && u2)) {
            message.reply('You must mention 2 people.');
            return;
        }

        if (util.interactionsBlocked(u1)) {
            if (u1.id !== message.author.id) return message.reply('The user you mentioned has interactions disabled.');
        }
        if (util.interactionsBlocked(u2)) {
            if (u2.id !== message.author.id) return message.reply('The user you mentioned has interactions disabled.');
        }

        // mix names
        let mixedName = mixNames(u1, u2);
        if (!util.automodAllows(mixedName, true)) { // one guy is named "nice" the other is named "lotbigger"
            mixedName = stringAddNames(u1, u2);
        }

        // make message
        let text = `${config.titleText}\n${config.pointDown} *\`\`${string1}\`\`*\n${config.pointUp} *\`\`${string2}\`\`*`;

        // generate embed
        const compatibility = generateCompatibility(u1, u2);
        const shipDetails = {
            progressBar: ProgressBar('pink', 10, compatibility),
            rating: 'rating goes here',
            ratingImage: './assets/gun.png'
        };
        // get rating


        // DID: fix compability shit
        for (const key in config.compatibilityRatings) {
            if (compatibility === parseInt(key)) {
                shipDetails.rating = config.compatibilityRatings[key].rating;
                shipDetails.ratingImage = config.compatibilityRatings[key].ratingImage;
                break;
            }
        }

        if (shipDetails.rating === "rating goes here") {
            for (const lowerBound of config.lowerBoundRatings) {
                if (compatibility <= lowerBound.max) {
                    shipDetails.rating = lowerBound.rating;
                    shipDetails.ratingImage = lowerBound.ratingImage;
                    break;
                }
            }
        }

        // add to embed
        const embed = new discord.MessageEmbed();
        embed.setColor(config.embedColor);
        embed.setDescription(`${config.nameShuffleEmoji} **${mixedName}**\n${compatibility}% ${shipDetails.progressBar} ${shipDetails.rating}`);
        embed.setFooter({
            text: `Requested by ${message.author.tag}`,
            iconURL: message.author.avatarURL({
                format: 'png'
            })
        });

        // generate image
        const jimpImage = new jimp({ width: 292, height: 128 });
        const userImage1Url = getUserAvatar(u1) ?? './assets/pink_default.jpg';
        const userImage2Url = getUserAvatar(u2) ?? './assets/pink_default.jpg';
        const userImage1 = await jimp.read(userImage1Url);
        const userImage2 = await jimp.read(userImage2Url);
        const maskImage = await jimp.read('./assets/mask_ship.png');
        const ratingImage = await jimp.read(shipDetails.ratingImage);
        userImage1.resize({ w: 128, h: 128 });
        userImage2.resize({ w: 128, h: 128 });
        jimpImage.composite(userImage1, 0, 0);
        jimpImage.composite(userImage2, 292 - 128, 0);
        jimpImage.mask(maskImage, 0, 0);
        jimpImage.composite(ratingImage, 146 - (ratingImage.width / 2), 64 - (ratingImage.height / 2));
        const buffer = await jimpImage.getBuffer(JimpMime.png);

        // add to embed
        // note: i think MessageAttachment has to be used here so that setImage gets the same file name as the buffer
        const attachment = new discord.MessageAttachment(buffer, 'ship.png');
        embed.setImage(`attachment://ship.png`);
        message.reply({
            content: text,
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