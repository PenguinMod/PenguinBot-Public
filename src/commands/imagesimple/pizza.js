const discord = require("discord.js");
const OptionType = require('../../util/optiontype');
const { Jimp: jimp, JimpMime } = require('jimp');

const listedToppings = [ // visual only for listings, validToppings includes actually usable toppings
    'pepperoni',
    'sausage',
    'pepper',
    'mushroom',
    'bacon',
    'onion',
    'cheese',
    'olive',
    'pineapple',
];
// this toppings list actually wasnt supposed to be public so people would manually figure it out... sorry about that 😬
const validToppings = [
    'sauce',
    'pepperoni',
    'cheese',
    'bacon',
    'onion',
    'olive',
    'pineapple',
    'meat',
    'ham',
    'cookie',
    'tomato',
    'watermelon',
    'chicken',
    'shrimp',
    'mayonnaise',
    'milk',
    'ketchup',
    'mustard',
    'lettuce',
    'sausage',
    'pepper',
    'mushroom',
    'broccoli',
    'spinach',
    'cheese',
    'apple',
    'orange',
    'lemon',
    'pear',
    'lime',
    'barbeque',
    'cheesecake',
    'cake',
    'waffle',
    'pancake',
    'glass',
    'plastic',
    'sand',
    'green',
    'red',
    'blue',
    'yellow',
    'salmon',
    'eggs',
    'squid',
    'crab',
    'octopus',
    'oyster',
    'celery',
    'cucumber',
    'pickle',
    'air',
    'juice',
    'saw',
    'joe',
    'john',
    'dorito',
    'sigma',
    'johnfortnite',
];
const toppingCounts = {
    pepperoni: 11,
    bacon: 6,
    meat: 9,
    olive: 9,
    ham: 9,
    pineapple: 11,
};

let texturesLoaded = false;
const pizzaTextures = {
    crust: null,
    sauce: null,
    cheese: null,
};
const toppingTextures = {};
(async () => {
    pizzaTextures.crust = await jimp.read(`./assets/pizza/crust.png`);
    pizzaTextures.sauce = await jimp.read(`./assets/pizza/sauce.png`);
    pizzaTextures.cheese = await jimp.read(`./assets/pizza/cheese.png`);
    for (const topping of validToppings) {
        toppingTextures[topping] = await jimp.read(`./assets/pizza/toppings/${topping}.png`);
    }
    texturesLoaded = true;
})();

const upperCaseFirstLetter = (text = '') => {
    text = String(text);
    return text.charAt(0).toUpperCase() + text.substring(1);
};
const randomInt = (num) => {
    return Math.round(Math.random() * num);
};
const wait = (ms) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
};

class Command {
    constructor(client, state) {
        this.name = "pizza";
        this.description = "Make a pizza with toppings.";
        this.attributes = {
            unlisted: false,
            admin: false,
            lockedToCommands: true,
        };
        this.example = [
            { text: `${state.prefix}pizza pepperoni`, image: "pizza_example1.png" },
            { text: `${state.prefix}pizza toppings` },
            { text: `${state.prefix}pizza` },
        ];
        this.slash = {
            options: [{
                type: OptionType.STRING,
                name: 'toppings',
                required: true,
                description: 'A list of toppings, seperated by commas. Type "list" to see toppings.'
            }]
        };

        this.client = client;
    }

    convertSlashCommand(interaction) {
        const toppings = interaction.options.getString('toppings');
        const split = toppings.includes(',') ? toppings.split(',') : toppings.split(' ');
        return [interaction, split, true];
    }

    attemptArgumentConversion(arg) {
        arg = String(arg).toLowerCase();
        switch (arg) {
            case 'cow':
            case 'penguin':
            case 'bear':
            case 'polarbear':
            case 'tiger':
            case 'horse':
            case 'donkey':
            case 'mule':
            case 'deer':
            case 'frog':
            case 'lion':
            case 'human':
            case 'dog':
            case 'cat':
            case 'lizard':
            case 'rabbit':
            case 'snake':
            case 'hamster':
            case 'bunny':
                return 'meat';
            case 'pig':
                return 'ham';
            case 'rooster':
            case 'chick':
                return 'chicken';
            case 'fish':
            case 'cod':
                return 'salmon';
            case 'barbecue':
                return 'barbeque';
            case 'egg':
                return 'eggs';
            case 'nothing':
            case 'nonexistent':
            case 'notopping':
                return 'air';
            case 'nuclear':
            case 'waste':
            case 'toxic':
            case 'goop':
                return 'green';
            case 'olives':
                return 'olive';
            case 'onions':
                return 'onion';
            case 'mushrooms':
                return 'mushroom';
            case 'peppers':
                return 'pepper';
            case 'pineapples':
                return 'pineapple';
            case 'sausages':
            case 'dick':
            case 'penis':
            case 'cock':
                return 'sausage';
            case 'doritos':
                return 'dorito';
            default:
                return arg;
        }
    }
    async invoke(message, args, isSlash) {
        isSlash = isSlash === true;
        if (args[0] === 'toppings' || args[0] === 'help' || args[0] === 'list') {
            const embed = new discord.MessageEmbed()
                .setColor('RED')
                .setDescription(`:pizza: Toppings :pizza:\n\n${listedToppings.map(topping => `- **${upperCaseFirstLetter(topping)}**`).join('\n')}`)
                .setFooter({ text: 'Type these toppings after the command to add them to your pizza.' })
                .setTitle('Toppings List');
            message.reply({
                embeds: [embed],
                ephemeral: true
            });
            return;
        }

        if (!texturesLoaded) return message.reply('An error occurred and the pizza textures are currently loading.\nPlease try again in a bit.');
        const validArguments = args
            .map(this.attemptArgumentConversion)
            .filter(arg => validToppings.includes(arg));
        if (validArguments.length <= 0) {
            for (let i = 0; i < 7; i++) {
                const randomTopping = listedToppings[Math.round(Math.random() * (listedToppings.length - 1))];
                validArguments.push(randomTopping);
            }
        }
        if (validArguments.length > 256) {
            return message.reply('There are too many toppings on this pizza.\nYou can only add up to 256 toppings at once.');
        }
        const username = message.member.displayName;
        const endsWithS = username.toLowerCase().endsWith('s');
        let respondedMessage = await message.reply({
            content: `*\`\`Cooking up your ${validArguments.join(' ')} pizza...\`\`*`.substring(0, 2000),
            files: ['./assets/pizzaloading.gif'],
            allowedMentions: { // ping NO ONE. this can DEFINETLY be abused if we did allow pings
                parse: [],
                users: [],
                roles: [],
                repliedUser: true
            }
        });
        if (isSlash) {
            respondedMessage = message;
            respondedMessage.edit = message.editReply;
        }

        // create the pizza
        // create our base image
        /**
         * @type {import("jimp").JimpInstance}
         */
        const baseImage = pizzaTextures.crust.clone();
        if (validArguments[0] !== 'air') {
            baseImage.composite(pizzaTextures.sauce, 0, 0);
        }
        if (validArguments[0] !== 'sauce' && validArguments[0] !== 'air') {
            baseImage.composite(pizzaTextures.cheese, 0, 0);
        }
        // add toppings
        const alreadyAddedToppings = [];
        let isFirstTopping = true;
        for (const topping of validArguments) {
            if (isFirstTopping && (topping === 'cheese')) {
                // cheese pizza shouldnt have extra cheese
                isFirstTopping = false;
                continue;
            }
            const amountToPlace = alreadyAddedToppings.includes(topping) ? 2 : toppingCounts[topping] || 2;
            for (let i = 0; i < amountToPlace; i++) {
                /**
                 * @type {import("jimp").JimpInstance}
                 */
                const texture = toppingTextures[topping].clone();
                texture.rotate(randomInt(360));
                const mag = randomInt(Math.round(192));
                const dir = randomInt(360);
                
                const x = (mag*Math.cos(dir)) - Math.round(texture.width / 2 - baseImage.width / 2);
                const y = (mag*Math.sin(dir)) - Math.round(texture.height / 2 - baseImage.height / 2);
                baseImage.composite(texture, x, y);
            }
            if (!alreadyAddedToppings.includes(topping)) {
                alreadyAddedToppings.push(topping);
            }
            isFirstTopping = false;
        }

        // output
        const buffer = await baseImage.getBuffer(JimpMime.png);
        const attachment = new discord.MessageAttachment(buffer, 'pizza.png');
        await wait(randomInt(1100) + 500);
        respondedMessage.edit({
            content: `:pizza: **${username}'${endsWithS ? '' : 's'} Pizza** :pizza:\n${validArguments.map(arg => upperCaseFirstLetter(arg)).join(', ')}`.substring(0, 2000),
            files: [attachment],
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
