const TextModifierCommand = require('../../basecommands/textmodifier');

const shouldDoThing = (chance, thing) => {
    if (Math.round(Math.random() * chance) === 0) {
        return thing ? thing : true;
    }
    return thing ? '' : false;
};

class Command extends TextModifierCommand {
    constructor(client) {
        super(client);
        this.name = "joe";
        this.description = "Joe-ify your text.";
        this.textDescription = "Text to joe-ify.";
        this.example = [
            { text: `{{prefix}}joe`, image: "joe_example1.png" },
            { text: `{{prefix}}joe Hello my text is here` },
            { text: `{{prefix}}joe (replying to a message)` },
        ];
        this.setSlashDetail();
    }

    /**
     * Joe the input text. Modified ver. of https://github.com/PuzzlingGGG/puzzlingggg.github.io/blob/main/joelator.html 
     * @param {string} text 
     * @returns {string}
     */
    modify(text) {
        let uwuText = text.replace(/\b\w+\b/g, function(match) {
            if (match.includes("mama")) {
                return '>:(';
            }
            let firstVowelIndex = match.search(/[aeiou]/i);
            if (match.length >= 4 && firstVowelIndex !== -1) {
                if (match[firstVowelIndex].toLowerCase() === 'o' && match.length > 1) {
                    return 'Jo' + match.slice(firstVowelIndex + 1);
                } else {
                    return 'Joe' + match.slice(firstVowelIndex + 1);
                }
            }
            return match;
        });

        if (shouldDoThing(3)) {
            uwuText += 'Joe';
        }

        const joemojis = [
            '<:joe:1203485574674128977>',
            '<:joe_stare:1203485609734185011>',
            '<:joekay:1203485636930179142>',
            '<:idontjoe:1203485654470631434>',
            '<:juuuuuh:1203488569440870430>',
            ' Joe',
            ' I love Joe',
            ' Super Joe!'
        ];
        let joemojisadding = Math.floor(Math.random() * 8) + 1; // make sure to update the number here if youre adding more ejohi shit
        for (let i = 0; i < joemojisadding; i++) {
            uwuText += joemojis[Math.floor(Math.random() * joemojis.length)];
        }

        return uwuText;
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
