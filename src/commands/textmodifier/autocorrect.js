const TextModifierCommand = require('../../basecommands/textmodifier');

class Command extends TextModifierCommand {
    constructor(client) {
        super(client);
        this.name = "autocorrect";
        this.description = "Autocorrect some text";
        this.textDescription = "Text to autocorrect.";
        this.setSlashDetail();
    }

    /**
     * Modify the input text
     * @param {string} text 
     * @returns {string}
     */
    modify(text) {
        let uwuText = text
            .toLowerCase()
            .replaceAll('a', 'ay')
            .replaceAll('e', 'uh')
            .replaceAll('i', 'ayee')
            .replaceAll('p', 'ph')
            .replaceAll('c', 'k')
            .replaceAll('k', 'c')
            .replaceAll('l', 'luh')
            .trim()
            .split(' ')
        return uwuText;
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
