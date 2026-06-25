// suggested by lily make thing
// "It compiles the message by removing unnecessary vowels and wordsn"
const TextModifierCommand = require('../../basecommands/textmodifier');

const delay = (ms) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
};

class Command extends TextModifierCommand {
    constructor(client) {
        super(client);
        this.name = "compile";
        this.description = "Removes totally unnecessary junk from your English text.";
        this.textDescription = "Text to totally superly clean up.";
        this.setSlashDetail();
        
        this.attributes.unlisted = true;
        delete this.example;
    }

    /**
     * Modify the input text
     * @param {string} text 
     * @returns {string}
     */
    async modify(text) {
        if (text === 'conditional' || text === 'branch') {
            await delay(750);
            return `An unknown error occurred.\nIR: Unknown input: procedures_return`;
        } else if (text.includes('conditional') || text.includes('branch')) {
            await delay(650); // uhh it needs to run in the interpreter lol........
        }

        /**
         * @type {string}
         */
        let compiledText = text
            .toLowerCase()
            .replace(/[\n\r\t]+/g, ' ')
            .replace(/[^a-z0-9 ]+/gi, '')
            .replaceAll('tion', 'shn')
            .replaceAll('ueue', 'u')
            .replaceAll('see', 'c')
            .replaceAll('las', 'ls')
            .replaceAll('ne', 'n')
            .replaceAll('ni', 'n')
            .replaceAll('oo', 'u')
            .replaceAll('ee', 'e')
            .replaceAll('ue', 'u')
            .replaceAll('ay', 'y')
            .replaceAll('an', 'n')
            .replaceAll("@", '')
            .replace(/[oe]+/g, '')
            .replaceAll('https://', '')
            .replaceAll('http://', '')
            .trim()
            .split(' ')
            .filter(word => word.length > 0)
            .join(' ');

        return compiledText;
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;