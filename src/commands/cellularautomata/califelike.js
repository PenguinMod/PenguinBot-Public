const fs = require('fs/promises');
const path = require('path');

const uuid = require("uuid");
const discord = require("discord.js");

const CellularAutomataLifeLike = require("../../util/cellularAutomata/lifeLike.js");
const runNewThread = require("../../util/multi-thread.js");

class Command {
    constructor() {
        this.name = "califelike";
        this.description = "Simulates Life-like Cellular Automata (default, Conway's Game of Life)";
        this.attributes = {
            permission: 0,
            lockedToCommands: true,
        };
        
        this.alias = ["conway", "gameoflife"];
    }

    async invoke(message, args, util) {
        // check that the rules are valid
        let bornAt, surviveAt;
        try {
            const rulestring = args[0] || "B3/S23";
            [bornAt, surviveAt] = CellularAutomataLifeLike.parseRulestring(rulestring);
        } catch {
            return message.reply("That's not a valid rulestring. Use nothing for the default `B3/S23` or follow `B(born at neighbors)/S(survive at neighbors)`.");
        }

        const [inputImage] = await util.getInputImagesForCommand(message);
        if (!inputImage) return;

        // create the other thread
        const loadingMessage = await message.reply('Creating GIF... <a:loading:1243400787980456006>');

        const requestId = uuid.v4();
        const tempDir = path.join(__dirname, `../../../temp/${requestId}/`);
        await fs.mkdir(tempDir, { recursive: true });

        const imagePath = path.join(tempDir, `image.png`);
        await fs.writeFile(imagePath, inputImage);
        
        // run that thread
        try {
            const { iterations, stagnantIterations, gifPath } = await runNewThread(
                path.join(__dirname, "../../resources/worker/cellularAutomata/califelike.worker.js"),
                path.join(__dirname, __filename),
                {
                    bornAt,
                    surviveAt,
                    tempDir,
                    imagePath
                }
            );

            // Send the image
            const gif = await fs.readFile(gifPath);
            const attachment = new discord.MessageAttachment(gif, "simulation.gif");
            await loadingMessage.edit({
                content: `<@${message.author.id}> Ran for ${iterations} iterations${stagnantIterations > 0 ? "" : " (never became stagnant)"}`,
                files: [attachment]
            });
        } catch (error) {
            console.error(error);
            loadingMessage.edit({ content: `An error occurred while editing the GIF. <:no:1164832595478069299>\n${error}` });
        } finally {
            await fs.rm(tempDir, { recursive: true, force: true });
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
