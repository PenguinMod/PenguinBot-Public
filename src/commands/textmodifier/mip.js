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
        this.name = "mip";
        this.description = "mip your text.";
        this.textDescription = "Text to mip.";
        this.example = [
            { text: `{{prefix}}mip Hello my text is here` },
            { text: `{{prefix}}mip (replying to a message)` },
        ];
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
            .replaceAll('!', 'mip')
            .replaceAll('l', 'mip')
            .replaceAll('r', 'mip')
            .replaceAll('ne', 'mip')
            .replaceAll('ni', 'mip')
            .replaceAll('.', 'mip')
            .replaceAll("'", 'mip')
            .replaceAll("@", 'mip')
            .replaceAll('tion', 'mip')
            .trim()
            .split(' ')
            .map(text => text.startsWith('hi') ? text.replace('hi', 'mip') + shouldDoThing(2, ' mip') : text)
            .map(text => shouldDoThing(4) ? text.charAt(0) + 'mip' + text : text)
            .join(' ')
            .replaceAll('https://', 'mip')
            .replaceAll('http://', 'mip');
        if ((!uwuText.endsWith("mip")) && shouldDoThing(1)) {
            uwuText += 'mip';
            if (shouldDoThing(1)) {
                uwuText += shouldDoThing(2) ? ' ._.' : ' :|';
            }
        }
        if (shouldDoThing(3)) {
            uwuText += 'mip';
        }

        return uwuText;
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;