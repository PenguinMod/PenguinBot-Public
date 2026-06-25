const TextModifierCommand = require('../../basecommands/textmodifier');

const shouldDoThing = (chance, thing) => {
    if (Math.round(Math.random() * chance) === 0) {
        return thing ? thing : true;
    }
    return thing ? '' : false;
};
const isJoe = (idx, array) => {
    switch (array[idx]) {
    case 'j':
        return array[idx +1] === 'o' && array[idx +2] === 'e'
    case 'o':
        return array[idx -1] === 'j' && array[idx +1] === 'e'
    case 'e':
        return array[idx -2] === 'j' && array[idx -1] === 'o'
    }
    return false
}

class Command extends TextModifierCommand {
    constructor(client) {
        super(client);
        this.name = "typo";
        this.description = "Give your text some typos.";
        this.textDescription = "Text to typo-ify.";
        this.example = [
            { text: `{{prefix}}typo Hello my text is here` },
            { text: `{{prefix}}typo (replying to a message)` },
        ];
        this.setSlashDetail();
    }

    /**
     * Give the input type some typos!!! yay!!!!!!!
     * @param {string} text 
     * @returns {string}
     */
    modify(text) {
        return text.split('').map((char, index, array) => {
            // joe is UNTYPOABLE 
            if (isJoe(index, array)) return char
            if (Math.random() < 0.05 && index < array.length - 1) {
                const temp = array[index + 1];
                array[index + 1] = char;
                return temp;
            }
            if (Math.random() < 0.02) {
                return char + char;
            }
            if (char.match(/[a-zA-Z0-9]/) && Math.random() < 0.05) {
                return String.fromCharCode(char.charCodeAt() + (Math.random() < 0.5 ? 1 : -1));
            }
            return char;
        }).join('');
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
