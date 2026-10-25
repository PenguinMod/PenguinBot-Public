const discord = require("discord.js");
const Canvas = require("skia-canvas");
const uuid = require("uuid");

const configuration = require("../../config.js");

const Lua = require("../../util/lua.js");
const BaseCommand = require("../../classes/basecommand.js");
const DiscordUtility = require("../../util/utility-discord.js");
const CharacterManager = require("../../util/character-manager.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "characteredit";
        this.description = "Create or modify a character for use with other character commands.";
        this.descriptionLong = "Create or modify a character for use with other character commands."
            + "\n" + "All characters are global and can be used by non-supporters. Supporters just get to add them and define their code."
            + "\n" + "- To create a character, do `{{prefix}}characteredit create (id of character) (name of character)`"
            + "\n" + "- To rename a character, do `{{prefix}}characteredit rename (id of character) (new name of character)`"
            + "\n" + "- To update the image of a character, do `{{prefix}}characteredit image (id of character)`"
            + "\n" + "- To delete a character, do `{{prefix}}characteredit delete (id of character)`"
            + "\n" + "Characters must have attached images. Attach an image on the `create` or `image` subcommands to set one."
            + "\n"
            + "\n" + "Characters can be scripted using the [Lua programming language](https://lua.org/)."
            + "\n" + "- To script a character, do `{{prefix}}characteredit script (id of character) (action commmand) (code)`"
            + "\n" + "  " + "- The `action command` segment asks for you to enter the command ({{prefix}}character`(action)`) you want this code to be used for."
            + "\n" + "  " + "  " + "- Examples: `fight`, `talk`, just whatever is after the word \"character\""
            + "\n" + "  " + "  " + "- See {{prefix}}help character`(action)` for code examples."
            + "\n" + "  " + "- The `code` segment can also be attached as a file."
            + "\n" + "  " + "- Your code must run within 5 seconds of runtime."
            + "\n" + "  " + "- If your code returns an automodded value, it will cause an error. Bypassing automod in code is still against the server rules."
            ;
        this.attributes = {
            exclusive: true,
            lockedToCommands: true,
            unlisted: true, // TODO: Temp
            permission: 0,
        };

        this.alias = ["editcharacter", "charedit", "editchar"];
    }

    async getFavoriteColor(imageBuffer) {
        // get their "favorite color" from the center of the image
        const canvas = new Canvas.Canvas(4, 4);
        const canvasImage = await Canvas.loadImage(imageBuffer);
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = "#ffae00";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(canvasImage, 0, 0, canvas.width, canvas.height);

        // grab the center pixel
        // DISCLOSURE: This bit is ai cuz lie cmon now this is not the fun bit of this commanmd
        // Calculate the center pixel's RGB value and format as CSS rgb()
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const centerX = Math.floor(canvas.width / 2);
        const centerY = Math.floor(canvas.height / 2);
        const idx = (centerY * canvas.width + centerX) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // now this is the color we wanna save
        const color = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
        return color;
    }

    async updateCharacterScript(characterId, action, luaCode) {
        // warm up the Lua runner (on Windows it can take a bit for processes to start)
        await Lua.evaluate("return true");

        // run the function a few times to see if it's valid. It should take max 5 seconds for all runs combined.
        const startTime = Date.now();
        for (let i = 0; i < 5; i++) {
            const luaActionScript = CharacterManager.getLuaContext(action, "register", luaCode);
            const returnValue = await Lua.evaluate(luaActionScript);

            // make sure we can process the output
            JSON.stringify(returnValue);
            Lua.stringify(returnValue);
            // check if the return value is inappropriate
            if (
                (typeof returnValue === "string" && !DiscordUtility.automodAllows(returnValue))
                || (typeof returnValue === "object" && !DiscordUtility.automodAllows(JSON.stringify(returnValue)))
            ) throw new Error("Returned value contains automodded content");

            // check if its been too long
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime > 5 * 1000) throw new Error("Several iterations take longer than 5 seconds");
        }

        // verified safe to add in
        const character = CharacterManager.get(characterId);
        CharacterManager.update(characterId, {
            actions: {
                ...character.actions,
                [action]: luaCode,
            }
        });
    }
    async invoke(message, args, util) {
        const subcommand = args.shift();
        if (!subcommand) return message.reply('Please provide a subcommand: `create | color | rename | image | delete | script`');

        // these all *edit* a character
        const characterId = args.shift();
        switch (subcommand) {
            case "create": {
                // get char info
                if (!characterId || characterId.length < 1 || characterId.length >= 64 || characterId.match(/[^a-z0-9]/i))
                    return message.reply('Please give your character a valid ID. It has to be 1 character minimum, and you must use characters A-Z and numbers 0-9.');
                if (!DiscordUtility.automodAllows(characterId))
                    return message.reply("You can't use that character ID. Pick something else.");
                if (CharacterManager.has(characterId)) return message.reply("Sorry, someone else owns that character ID.");
                const characterName = args.join(" ").trim();
                if (!characterName || characterName.length <= 0 || characterName.length >= 128 || characterName.includes("\n"))
                    return message.reply('Please give your character a valid name.');
                if (!DiscordUtility.automodAllows(characterName))
                    return message.reply("No, you aren't allowed to call your character that. Pick something else.");

                const [imageBuffer] = await util.getInputImagesForCommand();
                if (!imageBuffer) return;

                const color = await this.getFavoriteColor(imageBuffer);
                await CharacterManager.create({
                    id: characterId,
                    name: characterName,
                    color: color,
                    imageBuffer: imageBuffer,
                    author: message.author.id,
                    authorName: message.author.username,
                });
                const embed = new discord.MessageEmbed();
                embed.setTitle("Created a Character");
                embed.setColor(color);
                embed.setDescription(`I've saved **${characterId}** as **${characterName}**. This is their favorite color.`
                    + "\n" + "You can change their favorite color with the `color` subcommand.");
                return message.reply({
                    embeds: [embed],
                    allowedMentions: {
                        parse: [],
                        users: [],
                        roles: [],
                        repliedUser: true
                    }
                });
            }
            case "color": {
                const character = CharacterManager.get(characterId);
                if (!character) return message.reply("I don't know anyone by that character ID.");
                if (character.author !== message.author.id) return message.reply("You don't own that character.");
                
                // validate the new color
                const newColorInput = args.shift();
                if (!newColorInput) return message.reply("That's not a valid hex color code.");
                let newColor = (newColorInput.startsWith("#") ? newColorInput.slice(1)
                    : newColorInput).slice(0, 6);
                if (newColor.length === 3) {
                    const colorSplit = newColor.split("");
                    newColor = `${colorSplit[0]}${colorSplit[0]}${colorSplit[1]}${colorSplit[1]}${colorSplit[2]}${colorSplit[2]}`;
                } else if (newColor.length !== 6) {
                    return message.reply("That's not a valid hex color code.");
                }
                newColor = "#" + newColor;

                // set it
                CharacterManager.update(characterId, {
                    color: newColor
                });

                const embed = new discord.MessageEmbed();
                embed.setTitle("Updated color");
                embed.setColor(newColor);
                embed.setDescription(`I've updated **${character.name}**'s favorite color to the specified color.`);
                return message.reply({
                    embeds: [embed],
                    allowedMentions: {
                        parse: [],
                        users: [],
                        roles: [],
                        repliedUser: true
                    }
                });
            }
            case "rename": {
                const character = CharacterManager.get(characterId);
                if (!character) return message.reply("I don't know anyone by that character ID.");
                if (util.getPermissionLevel() < 2 && character.author !== message.author.id)
                    return message.reply("You don't own that character.");

                // get the new name & set it
                const characterName = args.join(" ").trim();
                if (!characterName || characterName.length <= 0 || characterName.length >= 128 || characterName.includes("\n"))
                    return message.reply('Please give your character a valid name.');
                if (!DiscordUtility.automodAllows(characterName))
                    return message.reply("No, you aren't allowed to call your character that. Pick something else.");
                
                CharacterManager.update(characterId, {
                    name: characterName
                });
                return message.reply({
                    content: `Renamed **${character.name}** to **${characterName}**!`,
                    allowedMentions: {
                        parse: [],
                        users: [],
                        roles: [],
                        repliedUser: true
                    }
                });
            }
            case "image": {
                const character = CharacterManager.get(characterId);
                if (!character) return message.reply("I don't know anyone by that character ID.");
                if (character.author !== message.author.id) return message.reply("You don't own that character.");

                const [imageBuffer] = await util.getInputImagesForCommand();
                if (!imageBuffer) return;

                await CharacterManager.updateImage(characterId, imageBuffer);
                return message.reply({
                    content: `Updated the image for **${character.name}**.`,
                    allowedMentions: {
                        parse: [],
                        users: [],
                        roles: [],
                        repliedUser: true
                    }
                });
            }
            case "delete": {
                const character = CharacterManager.get(characterId);
                if (!character) return message.reply("I don't know anyone by that character ID.");
                if (util.getPermissionLevel() < 2 && character.author !== message.author.id)
                    return message.reply("You don't own that character.");

                await CharacterManager.delete(characterId);
                return message.reply("Deleted that character.");
            }
            case "script": {
                const character = CharacterManager.get(characterId);
                if (!character) return message.reply("I don't know anyone by that character ID.");
                if (util.getPermissionLevel() < 2 && character.author !== message.author.id)
                    return message.reply("You don't own that character.");

                // check that the action has a corresponding command
                const actionName = args.shift();
                if (!actionName)
                    return message.reply("Specify an action to script."
                        + "\n" + "See `character(action)` commands seen in the help command for actions.");
                if (!Object.keys(util.commands).includes(`character${actionName}`))
                    return message.reply("There's no corresponding command for that action."
                        + "\n" + "See `character(action)` commands seen in the help command for actions.");
                // these comands start with character, but dont actually represent an action.
                if (["", "edit"].includes(actionName))
                    return message.reply("That is not a valid action you can script.");

                // get the lua script. Technically file size and text length are different but whatever
                let luaScript = args.join(" ");
                const luaAttachment = message.attachments.first();
                if (luaScript.length > 4 * 1024) return message.reply("That script is too long.");
                if (luaAttachment && luaAttachment.size > 4 * 1024) return message.reply("That script is too long.");
                if (luaAttachment) {
                    const attachmentFetch = await fetch(luaAttachment.url);
                    const attachmentString = await attachmentFetch.text();
                    luaScript = attachmentString;
                }

                message.channel.sendTyping();
                try {
                    await this.updateCharacterScript(characterId, actionName, luaScript);
                    return message.reply({
                        content: `Successfully registered that script for \`${actionName}\`.`,
                        allowedMentions: {
                            parse: [],
                            users: [],
                            roles: [],
                            repliedUser: true
                        }
                    });
                } catch (err) {
                    return message.reply({
                        content: `That script is malformed or invalid; ${err}`,
                        allowedMentions: {
                            parse: [],
                            users: [],
                            roles: [],
                            repliedUser: true
                        }
                    });
                }
            }
            default:
                return message.reply('Please provide a valid subcommand: `create | color | rename | image | delete | script`');
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;