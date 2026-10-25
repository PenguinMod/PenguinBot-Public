const discord = require("discord.js");

const BaseCommand = require("../../classes/basecommand.js");
const CharacterManager = require("../../util/character-manager.js");

const getHsvFromRgb = hexCode => {
    hexCode = hexCode.slice(1)
    if (hexCode.length === 3) {
        const r = hexCode.slice(0, 1)
        const g = hexCode.slice(1, 2)
        const b = hexCode.slice(2, 3)
        hexCode = `${r}${r}${g}${g}${b}${b}`
    }

    const r = parseInt(hexCode.slice(0, 2), 16) / 255;
    const g = parseInt(hexCode.slice(2, 4), 16) / 255;
    const b = parseInt(hexCode.slice(4, 6), 16) / 255;
    const x = Math.min(Math.min(r, g), b);
    const v = Math.max(Math.max(r, g), b);

    // For grays, hue will be arbitrarily reported as zero. Otherwise, calculate
    let h = 0;
    let s = 0;
    if (x !== v) {
        const f = (r === x) ? g - b : ((g === x) ? b - r : r - g);
        const i = (r === x) ? 3 : ((g === x) ? 5 : 1);
        h = ((i - (f / (v - x))) * 60) % 360;
        s = (v - x) / v;
    }

    return { h, s, v };
}

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "character";
        this.description = "See the index of characters on the bot.";
        this.descriptionLong = "See the index of characters on the bot."
            + "\n" + "All characters are global and can be used by non-supporters. Supporters just get to add them and define their code."
            + "\n" + "- To get a list of all characters, use the command without any parameters."
            + "\n" + "- To see the details of a specific character, add a character ID to the command."
            ;
        this.attributes = {
            helpIcon: "😃",
            lockedToCommands: true,
            unlisted: true, // TODO: Temp
            permission: 0,
        };

        this.alias = ["characterget", "getcharacter", "charget", "char"];
    }

    getColorIcon(hexColor) {
        const hsv = getHsvFromRgb(hexColor);

        // just use black or white if bright or dark
        if (hsv.s <= 0.2) {
            if (hsv.v < 0.5) return "⚫";
            return "⚪";
        }
        
        // colors
        if (hsv.h <= 16) return "🔴";
        if (hsv.h <= 42) return "🟠";
        if (hsv.h <= 69) return "🟡";
        if (hsv.h <= 164) return "🟢";
        if (hsv.h <= 265) return "🔵";
        return "🟣";
    }
    async handleSendingList(message, args, util) {
        const characterList = CharacterManager.getList();
        const embed = new discord.MessageEmbed();
        embed.setColor("#ffae00");
        embed.setTitle("Character List");

        const charactersListed = [];
        for (const characterId of Object.keys(characterList).sort()) {
            const character = characterList[characterId];
            charactersListed.push(character);
        }

        // create the list message
        const charactersOnOnePage = 12;
        const maxPages = Math.ceil(charactersListed.length / charactersOnOnePage);
        let buttonRow = [];

        // handle element updates
        let page = 0;
        let disabled = false;
        const setElements = (page) => {
            const characters = charactersListed.slice(page * charactersOnOnePage, (page + 1) * charactersOnOnePage);
            const characterList = characters.map(character => `${this.getColorIcon(character.color)} **${character.id}** — **${character.name}** by <@${character.author}>`);
            embed.setDescription(characterList.join('\n'));
            embed.setFooter({ text: `Page ${page + 1} - ${maxPages} | ${charactersListed.length} characters | Characters can be uploaded by supporters.` });

            buttonRow = [
                new discord.MessageActionRow().addComponents([
                    new discord.MessageButton({
                        customId: 'last',
                        style: 'PRIMARY',
                        label: "◀",
                        disabled: disabled || page === 0,
                    }),
                    new discord.MessageButton({
                        customId: 'next',
                        style: 'PRIMARY',
                        label: "▶",
                        disabled: disabled || page === (maxPages - 1),
                    })
                ])
            ];
        };
        setElements(page);
        const characterListMessage = await message.reply({
            embeds: [embed],
            components: buttonRow,
            ephemeral: true,
            fetchReply: true,
            allowedMentions: {
                parse: [],
                users: [],
                roles: [],
                repliedUser: true
            }
        });

        // listen for button presses by the requester
        const collector = characterListMessage.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 5 * 60 * 1000 // 5 minutes
        });
        collector.on('collect', async (i) => {
            if (i.customId === "last") {
                page = Math.max(0, page - 1);
            } else if (i.customId === "next") {
                page = Math.min(page + 1, maxPages - 1);
            }

            setElements(page);
            i.update({
                embeds: [embed],
                components: buttonRow,
            });
        });
        collector.on('end', () => {
            disabled = true;
            setElements(page);
            characterListMessage.edit({
                embeds: [embed],
                components: buttonRow,
            })
        });
    }
    async invoke(message, args, util) {
        // if no character ID, then send a list of characters
        const characterId = args.shift();
        if (!characterId)
            return await this.handleSendingList(message, args, util);

        // assume specific ID
        const character = CharacterManager.get(characterId);
        if (!character) return message.reply("I don't know anyone by that character ID.");

        const imageBuffer = await CharacterManager.getImage(characterId);
        const attachment = new discord.MessageAttachment(imageBuffer, 'character.png');

        const embed = new discord.MessageEmbed();
        embed.setTitle(characterId);
        embed.setColor(character.color);
        embed.setImage(`attachment://character.png`);
        embed.setFields({
            name: "Name",
            value: character.name,
        }, {
            name: "Actions",
            value: Object.keys(character.actions || {}).join(", ") || "*none*",
        }, {
            name: "Author",
            value: `<@${character.author}>`,
            inline: true,
        }, {
            name: "Color",
            value: character.color,
            inline: true,
        });
        return message.reply({
            embeds: [embed],
            files: [attachment],
            allowedMentions: {
                parse: [],
                users: [],
                roles: [],
                repliedUser: true
            }
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;