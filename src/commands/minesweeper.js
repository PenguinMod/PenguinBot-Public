const discord = require("discord.js");

const OptionType = require('../util/optiontype.js');
const BaseCommand = require("../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "mine";
        this.description = "Generate a Minesweeper game.";
        this.descriptionLong = "Generate a Minesweeper game with spoiler tags for each square."
            + "\n" + "Specify the column and row count for the grid, then the amount of mines to place.";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };

        this.alias = ["minesweeper"];
        this.example = [
            { text: "{{prefix}}mine 9 9 4"},
            { text: "{{prefix}}mine 3 3 0"},
            { text: "{{prefix}}mine 4 2 3"},
        ];
    }

    invoke(message, args) {
        if (args.length === 0)
            return message.reply("Usage: `<columns> <rows> <mines>`.");
        
        const columns = Number(args[0]);
        const rows = Number(args[1]);
        const mines = Number(args[2] || 0);
        try {
            const board = this.generateBoard(columns, rows, mines);
            const emojiBoard = this.replaceEmojis(board);

            const embed = new discord.MessageEmbed();
            embed.setTitle("Minesweeper Game");
            embed.setDescription(emojiBoard);
            embed.setColor("#00c3ff");

            return message.reply({
                embeds: [embed],
            });
        } catch (error) {
            return message.reply({
                content: `${error.message || error}`,
                allowedMentions: {
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: true,
                }
            });
        }
    }

    // DISCLOSURE: AI because the original was likely copied already (also i minesweeper is generic so)
    generateBoard(columns, rows, mines) {
        if (
            !Number.isInteger(columns) ||
            !Number.isInteger(rows) ||
            !Number.isInteger(mines)
        ) {
            throw new Error("Columns, rows, and mines must be whole numbers.");
        }

        if (columns <= 0 || rows <= 0) {
            throw new Error("The board must have a positive width and height.");
        }

        const boardSize = columns * rows;

        if (boardSize > 256) {
            throw new Error("The board is too big.");
        }

        if (mines < 0) {
            throw new Error("The number of mines cannot be negative.");
        }

        if (mines > boardSize) {
            throw new Error("There are too many mines for this board size.");
        }

        const board = Array.from(
            { length: rows },
            () => Array(columns).fill("0")
        );

        // Create a list of every board position.
        const positions = [];

        for (let row = 0; row < rows; row++) {
            for (let column = 0; column < columns; column++) {
                positions.push([row, column]);
            }
        }

        // Shuffle the positions and use the first N for mines.
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        for (let i = 0; i < mines; i++) {
            const [row, column] = positions[i];
            board[row][column] = "x";
        }

        // Calculate the numbers around each mine.
        for (let row = 0; row < rows; row++) {
            for (let column = 0; column < columns; column++) {
                if (board[row][column] === "x") {
                    continue;
                }

                let mineCount = 0;

                for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
                    for (let columnOffset = -1; columnOffset <= 1; columnOffset++) {
                        if (rowOffset === 0 && columnOffset === 0) {
                            continue;
                        }

                        const nearbyRow = row + rowOffset;
                        const nearbyColumn = column + columnOffset;

                        if (
                            nearbyRow >= 0 &&
                            nearbyRow < rows &&
                            nearbyColumn >= 0 &&
                            nearbyColumn < columns &&
                            board[nearbyRow][nearbyColumn] === "x"
                        ) {
                            mineCount++;
                        }
                    }
                }

                board[row][column] = String(mineCount);
            }
        }

        return board.map(row => row.join("")).join("\n");
    }

    replaceEmojis(board) {
        const replacements = {
            x: "||:boom:||",
            0: "||:zero:||",
            1: "||:one:||",
            2: "||:two:||",
            3: "||:three:||",
            4: "||:four:||",
            5: "||:five:||",
            6: "||:six:||",
            7: "||:seven:||",
            8: "||:eight:||",
            9: "||:nine:||",
        };

        return board.replace(/[x0-9]/g, character => replacements[character]);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;

//mubi was here :3