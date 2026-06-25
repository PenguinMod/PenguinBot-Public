const TextModifierCommand = require('../../basecommands/textmodifier');

class AhhCommand extends TextModifierCommand {
    constructor(client) {
        super(client);
        this.name = "ahh";
        this.description = "ahh your text.";
        this.textDescription = "Text to ahh.";
        this.example = [
            { text: `{{prefix}}ahh Hello my text is here` },
            { text: `{{prefix}}ahh (replying to a message)` },
        ];
        this.setSlashDetail();
    }

    /**
     * Modify the input text
     * @param {string} text 
     * @returns {string}
     */
    modify(text) {
        const contentArray = text.replaceAll("@","ahh").split(' ');
        const modifiedContent = contentArray.map(word => {
            // Randomly decide whether to modify the word
            if (Math.random() < 0.6) {
                if (Math.random() < 0.4) {
                    return word + ' ahh';
                }
                // Replace random characters with 'ahh'
                return word.split('').map(char => {
                    if (Math.random() < 0.3) {
                        return char + 'ahh';
                    }
                    return char;
                }).join('');
            }
            return word;
        }).join(' ');
        if (Math.random() < 0.1) {
            return modifiedContent + ' :regional_indicator_a::regional_indicator_h::regional_indicator_h:';
        }
        return modifiedContent;
    }
}

module.exports = AhhCommand;
