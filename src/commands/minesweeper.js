const discord = require("discord.js");
const OptionType = require('../util/optiontype');

let i;
let j;
let x;
let y;
let v;
let w;

class Command {
    constructor() {
        this.name = "mine";
        this.description = "Generate an Minesweeper Game.";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };
    }

    invoke(message, args) {
        let columns = args[0];
        let rows = args[1];
        let mines = args[2];

        try {
            var result = generateBoard(Number(columns), Number(rows), Number(mines));
            
            // Define replacement rules
            const replacementRules = {
                'x': '||:boom:||',
                '0': '||:zero:||',
                '1': '||:one:||',
                '2': '||:two:||',
                '3': '||:three:||',
                '4': '||:four:||',
                '5': '||:five:||',
                '6': '||:six:||',
                '7': '||:seven:||',
                '8': '||:eight:||',
                '9': '||:nine:||'
                // Add more rules as needed
            };

            // Apply replacements
            result = replaceEmojis(result, replacementRules);
            
            const embed = new discord.MessageEmbed()
                .setTitle("Minesweeper Game")
                .setDescription(result)
                .setColor("#00b0f4");

            message.reply({ embeds: [embed] });
        } catch (error) {
            message.reply(`Error: ${error}`);
        }

        function generateBoard(columns, rows, mines) {
            if (columns <= 0 || rows <= 0) {
                throw "Invalid size"
            }
            if (columns * rows > 512) {
                throw "Board is too big"
            }
            if (mines > columns * rows) {
                throw "Too many mines"
            }
            if (mines < 0) {
                throw "Too little mines"
            }

            var array = Array(columns).fill("0")
            for (i in array) {
                array[i] = Array(rows).fill("0")
            }

            //place mines
            var placesGone = 0
            for (i in array) {
                for (j in array[i]) {
                    if (Math.random() < mines / (columns * rows - placesGone)) {
                        mines -= 1
                        array[i][j] = "x"
                    }
                    placesGone += 1
                }
            }

            //upd numbers
            function check(i, j) {
                return array[i] !== undefined && array[i][j] !== undefined && array[i][j] === "x"
            }
            for (x in array) {
                i = Number(x)
                for (y in array[i]) {
                    j = Number(y)
                    if (check(i, j)) continue
                    var num = 0
                    num += check(i+1, j)
                    num += check(i+1, j+1)
                    num += check(i, j+1)
                    num += check(i-1, j+1)
                    num += check(i-1, j)
                    num += check(i-1, j-1)
                    num += check(i, j-1)
                    num += check(i+1, j-1)
                    array[i][j] = String(num)
                }
            }

            //stringify
            var string = ""
            for (v of array) {
                for (w of v) {
                    string += w
                }
                string += '\n'
            }

            return string;
        }

        function replaceEmojis(input, rules) {
            for (const [key, value] of Object.entries(rules)) {
                input = input.replace(new RegExp(key, 'g'), value);
            }
            return input;
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;

//mubi was here :3