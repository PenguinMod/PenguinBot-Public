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
        this.name = "uwu";
        this.description = "UwU-ify your text. Why must I be forced to program these things.";
        this.textDescription = "Text to uwu-ify.";
        this.example = [
            { text: `{{prefix}}uwu`, image: "uwu_example1.png" },
            { text: `{{prefix}}uwu Hello my text is here` },
            { text: `{{prefix}}uwu (replying to a message)` },
        ];
        this.alias = ['uwuify'];
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
            .replaceAll('!', '!!1')
            .replaceAll('l', 'w')
            .replaceAll('r', 'w')
            .replaceAll('ne', 'nye')
            .replaceAll('ni', 'nyi')
            .replaceAll('ot', 'owt')
            .replaceAll('uy', 'uwy')
            .replaceAll('.', '')
            .replaceAll("'", '')
            .replaceAll("@", '')
            .replaceAll('tion', 'tun')
            .trim()
            .split(' ')
            .map(text => text.startsWith('hi') ? text.replace('hi', 'hai') + shouldDoThing(2, 'iii') : text)
            .map(text => shouldDoThing(4) ? text.charAt(0) + '-' + text : text)
            .join(' ')
            .replaceAll('https://', '<:BLEH:1123465973312278629>://')
            .replaceAll('http://', '<:BLEH:1123465973312278629>://');
        if ((!uwuText.endsWith("~")) && shouldDoThing(1)) {
            uwuText += '~';
        }
        if (shouldDoThing(3)) {
            uwuText += ' <:BLEH:1123465973312278629>';
        }
        if (shouldDoThing(1)) {
            uwuText += shouldDoThing(2) ? ' >~<' : ' :3';
        }

        return uwuText;
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;