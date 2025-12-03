const axios = require('axios');
const JSZip = require('jszip');
const ProjectApi = require('../../util/project-api');
const OptionType = require('../../util/optiontype');
const { createCanvas, loadImage, registerFont } = require('canvas'); // best when dealing with text & shapes
const { Jimp: jimp, JimpMime } = require('jimp'); // best for adding effects to images & dealing with transparency

registerFont('./assets/fonts/helvetica-neue/HelveticaNeue-Medium.otf', { family: 'HelveticaNeue', weight: "regular" });
registerFont('./assets/fonts/helvetica-neue/HelveticaNeueBold.ttf', { family: 'HelveticaNeueBold', weight: "regular" });

const imageScale = 2 // 200% (double orignal)
const graphWidth = 500
const graphHeight = 80
const graphStart = 320 - (graphWidth / 2)
const propEntryWidth = 160
const propEntryHeight = 50
const statProps = [
    ['Blocks', 'blocks'],
    ['Extensions', 'extensions'],
    ['Sprites', 'sprites'],
    ['Costumes', 'costumes'],
    ['Sounds', 'sounds'],
    ['Variables', 'variables'],
    ['Lists', 'lists'],
    ['Broadcasts', 'broadcasts'],
    ['Comments', 'comments'],
    ['Fonts', 'fonts']
]
const lastLineWidth = 320 - ((((statProps.length - 1) % 4) * propEntryWidth) / 2)
const lastLine = Math.floor(statProps.length / 4) + 1
const coreExtensionUrls = {};
(async () => {
    const coreExtRegex = /([\w$_]+):\s+\(\)\s+=>\s+require\(['"`](.+)['"`]\)/ig;
    const extensionObjectRegex = /const defaultBuiltinExtensions = {(.+)};/s

    const extensionManagerUrl = 'https://raw.githubusercontent.com/PenguinMod/PenguinMod-Vm/develop/src/extension-support/extension-manager.js';
    const response = await axios.get(extensionManagerUrl);
    // get the extensions object
    const code = String(response.data);
    const internalExtensions = extensionObjectRegex.exec(code)[1];
    // turn each extension into its own file path
    // right now we have matched something like this:
    // jgDev: () => require("../extensions/jg_dev")
    for (const [_, id, extPath] of internalExtensions.matchAll(coreExtRegex)) {
        let gitUrl = '/src/extensions/' + extPath; // usage of the path module will add the C: directory to the url, which is invalid
        if (!gitUrl.endsWith('.js')) gitUrl += '/index.js'
        coreExtensionUrls[id] = `https://raw.githubusercontent.com/PenguinMod/PenguinMod-Vm/develop/${gitUrl}`
    }
})();

const extColorRegex = /color1["'`]?\s*:\s*["'`]?(#[a-f\d]{3}(?:[a-f\d]{3})?)/i
const extNameRegex = /name["'`]?:\s+(Scratch\.translate\(|formatMessage\({\s+id:\s["'`].+["'`],\s+default:\s+)?["'`](.+)["'`]\)?/i
const defaultExtensionColor = "#0FBD8C";
const CoreExtensionOrder = [
    'motion',
    'looks',
    'sound',
    'event',
    'control',
    'sensing',
    'operator',
    'variables',
    'lists',
    'procedures'
];
const categories = {
    motion: ['Motion', '#4C97FF'],
    looks: ['Looks', '#9966FF'],
    sound: ['Sound', '#D65CD6'],
    event: ['Events', '#FFD500'],
    control: ['Control', '#FFAB19'],
    sensing: ['Sensing', '#4CBFE6'],
    operator: ['Operators', '#40BF4A'],
    variables: ['Variables', '#FF8C1A'],
    lists: ['Lists', '#FF661A'],
    procedures: ['My Blocks', '#FF6680'],
    // internal extensions (incase it coulsnt be found)
    jg3d: ['3D', '#B100FE']
};
// axios & node-fetch cannot get data URLs that are not encoded with base64
// this is proven, i literally ran the code and axios & node-fetch both failed to fetch a URL encoded data URL
// ex: data:application/javascript,%2F%2F%20Parcialmente%20nublado%20lluvia%20icon%20by%20Icons8%0Aconst%20weatherico
// pasting that above will work in browser, but axios & fetch refuse to work with it
const decodeDataUrl = (url) => {
    const commaIdx = url.indexOf(',');
    const urlMeta = url.substring(0, commaIdx);
    const urlData = url.substring(commaIdx + 1);
    if (urlMeta.endsWith('base64')) {
        return Buffer.from(urlData, 'base64').toString('utf8');
    } else {
        return decodeURIComponent(urlData);
    }
};
const fetchOrDecode = async (url) => {
    if (url.startsWith('data:')) {
        return { data: decodeDataUrl(url) };
    } else {
        return await axios.get(url);
    }
};
const getOrMakeCategory = async (id, url) => {
    if (categories[id]) return categories[id];
    if (!id && !url) return;
    if (id && !url) {
        if (!coreExtensionUrls[id]) return;
        url = coreExtensionUrls[id];
    }
    try {
        const { data: code } = await fetchOrDecode(url);
        const [_, __, name] = extNameRegex.exec(code) ?? []
        const [___, color] = extColorRegex.exec(code) ?? []
        if (!name) console.log(id, code)
        const ext = [name ?? 'Unknown', color ?? defaultExtensionColor]

        categories[id] = ext
        return ext;
    } catch (err) {
        console.error(err)
        return ['Unknown', defaultExtensionColor];
    }
}
const getExtensionIdForOpcode = function (opcode) {
    if (typeof opcode !== 'string') {
        console.error('invalid opcode ' + opcode);
        return '';
    }
    const index = opcode.indexOf('_');
    const forbiddenSymbols = /[^\w-]/g;
    const prefix = opcode.substring(0, index).replace(forbiddenSymbols, '-');
    return prefix;
};
const hsvCache = {}
const getHsvFromRgb = hexCode => {
    if (hsvCache[hexCode]) return hsvCache[hexCode]

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
    hsvCache[hexCode] = { h, s, v }

    return { h, s, v };
}

const statsCache = {};
const collectProjectInfo = async id => {
    let project, projectJson
    try {
        project = await ProjectApi.getProjectMeta(id);
        const save = await ProjectApi.getProjectFile(id)
        try {
            const zip = await JSZip.loadAsync(save)
            const file = zip.file('project.json')
            const fileData = await file.async('string')
            projectJson = JSON.parse(fileData);
        } catch (err) {
            console.error(err)
            projectJson = null
        }
    } catch (err) {
        console.error(err)
        return;
    }

    console.log('fetched', id, project.name);
    return {
        name: project.name,
        owner: project.owner,
        projectJson
    }
}

class Command {
    constructor(_, state) {
        this.name = "analyze";
        this.description = "Analyze a PenguinMod project by it's ID to get info about it's contents.";
        this.attributes = {
            unlisted: false,
            admin: false,
            lockedToCommands: true,
        };
        this.example = [
            { text: `${state.prefix}analyze 4023876129249`, image: "analyze_example1.png" },
            { text: `${state.prefix}analyze (project id)` },
        ];
        this.slash = {
            options: [{
                type: OptionType.INTEGER,
                name: 'project',
                required: true,
                description: 'A PenguinMod project ID.'
            }]
        };
    }

    convertSlashCommand(interaction) {
        const id = interaction.options.getInteger('project');
        interaction.deferReply()
        interaction.reply = interaction.editReply
        return [interaction, [id], true];
    }

    async invoke(message, [projectId], isMessage) {
        isMessage = isMessage !== true
        if (isMessage) message.channel.sendTyping();

        let stats = statsCache[projectId]
        if (!stats) {
            const info = await collectProjectInfo(projectId)
            if (!info) return message.reply('No project was found. Please check the ID again.');
            if (!info.projectJson) return message.reply('No project was found. Please check the ID again.');
            // resend typing just incase discord canceled it from wating to long
            if (isMessage) message.channel.sendTyping();
            const extensionIds = [...CoreExtensionOrder, ...info.projectJson.extensions]
            stats = {
                name: info.name,
                owner: info.owner,
                blocks: 0,
                sprites: info.projectJson.targets.length,
                broadcasts: 0,
                costumes: 0,
                sounds: 0,
                lists: 0,
                variables: 0,
                comments: 0,
                fonts: info.projectJson.customFonts?.length ?? 0,
                extensions: info.projectJson.extensions.length,
                extensionBlockCount: 0,
                extensionUses: {},
                extensionOrder: extensionIds
                    .map(extId => [extId, info.projectJson.extensionURLs?.[extId]])
            }

            for (const sprite of info.projectJson.targets) {
                stats.variables += Object.keys(sprite.variables).length
                stats.lists += Object.keys(sprite.lists).length
                stats.broadcasts += Object.keys(sprite.broadcasts).length
                stats.comments += Object.keys(sprite.comments).length
                stats.costumes += sprite.costumes.length
                stats.sounds += sprite.sounds.length

                for (const blockId in sprite.blocks) {
                    const block = sprite.blocks[blockId]
                    const extId = getExtensionIdForOpcode(block.opcode)
                    if (block.shadow) continue
                    stats.blocks++
                    if (!extensionIds.includes(extId) && extId !== 'data') continue
                    stats.extensionBlockCount++
                    if (extId === 'data') {
                        const realCategory = block.opcode.includes('list')
                            ? 'lists'
                            : 'variables'
                        stats.extensionUses[realCategory] ??= 0
                        stats.extensionUses[realCategory]++
                        continue
                    }
                    stats.extensionUses[extId] ??= 0
                    stats.extensionUses[extId]++
                }
            }

            statsCache[projectId] = stats
        }
        // render the joe mama card
        // this is stupidly innefiecent but theres no other way i can see since 
        // ctx.filter just doesnt fucking work at all here for somereason
        const projectImageUrl = `https://projects.penguinmod.com/api/pmWrapper/iconUrl?id=${projectId}&widescreen=true`;
        const backgroundImage = await jimp.read(projectImageUrl);
        backgroundImage.opaque();
        backgroundImage.resize({ w: 640, h: 360 }); // we need more space
        backgroundImage.blur(24); // just looks better :idk_man:
        backgroundImage.brightness(-0.5); // so we can use white text
        const finalizedBackground = await backgroundImage.getBuffer(JimpMime.png);

        const background = await loadImage(finalizedBackground)
        const card = createCanvas(640 * imageScale, 360 * imageScale);
        const ctx = card.getContext('2d');
        ctx.scale(imageScale, imageScale)

        ctx.fillStyle = 'hsl(0, 0%, 50%)'
        // idk how to do the opaque thingy to prevent the background from being transparent!!!!!!
        ctx.fillRect(0, 0, 640, 360)

        // leaving this here just incase it decides to work
        ctx.filter = 'blur(5px) brightness(50%)'
        ctx.drawImage(background, 0, 0, 640, 360)
        ctx.filter = 'none'

        ctx.textAlign = 'center'
        ctx.font = '24px "HelveticaNeueBold"';
        ctx.fillStyle = 'white'
        ctx.fillText(stats.name, 320, 45, 600)
        ctx.font = '20px "HelveticaNeueBold"';
        ctx.textBaseline = "middle";
        ctx.fillText('Blocks Used', 320, 345, 600)

        for (const idx in statProps) {
            const [name, prop] = statProps[idx]
            const lx = idx % 4
            const ly = Math.floor(idx / 4) + 1
            const cx = (lx * propEntryWidth) + (ly === lastLine
                ? lastLineWidth
                : 80)
            const cy = (ly * propEntryHeight) + 40

            ctx.font = '16px "HelveticaNeue"';
            ctx.textBaseline = "alphabetic";
            ctx.fillStyle = "white";
            ctx.fillText(name, cx, cy, 320);
            ctx.font = '24px "HelveticaNeueBold"';
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#FFDD00";
            const number = stats[prop];
            ctx.fillText(number, cx, cy + 18, 320);
        }

        // draw le extension garph
        ctx.textAlign = 'left'
        ctx.fillStyle = "white";
        ctx.font = '8px "HelveticaNeue"';
        let lastX = graphStart
        let lastTextEnd = 0
        let lastColor = ''
        for (const idx in stats.extensionOrder) {
            const [extId, extUrl] = stats.extensionOrder[idx]
            const usageCount = stats.extensionUses[extId] ?? 0
            const percent = usageCount / stats.extensionBlockCount
            const width = Math.floor(percent * graphWidth)
            const [name, color] = await getOrMakeCategory(extId, extUrl)
            // skip entries with zero width
            if (!width) continue
            // draw graph chunk
            ctx.fillStyle = color;
            ctx.fillRect(lastX, 230, width, graphHeight)
            // if the colors are the same then add a full length devider
            if (lastColor === color) {
                ctx.fillStyle = 'lightgrey'
                ctx.fillRect(lastX, 230, 0.5, graphHeight)
            }
            lastColor = color
            // draw chunk label
            ctx.fillStyle = 'white'
            const txtMeasurements = ctx.measureText(name)
            const txtWidth = txtMeasurements.actualBoundingBoxRight
            const txtHeight = (txtMeasurements.actualBoundingBoxAscent + txtMeasurements.actualBoundingBoxDescent) + 3
            // console.log(txtHeight)
            if (txtWidth < width) {
                const categoryHsv = getHsvFromRgb(color)
                const distanceToYellow = Math.abs(categoryHsv.h - 60) / 40;
                const textLightness = Math.round(Math.max(Math.min(((distanceToYellow * distanceToYellow) / 2) * categoryHsv.v, 1), 0)) * 100
                // console.log(textLightness, categoryHsv)
                ctx.fillStyle = `hsl(0, 0%, ${textLightness}%)`;
                ctx.textBaseline = "top";
                ctx.fillRect(lastX, 302, 1, 8)
                ctx.fillText(name, lastX + 2, 302, width - 2)
                // make sure that the next text piece wont think its going to collide
                lastTextEnd = 0

                lastX += width
                continue
            }
            ctx.textBaseline = "middle";
            let dir = -45
            let ty = 226
            let my = 226
            if (lastTextEnd < lastX) {
                dir = 45
                ty = 314
                my = 308
                lastTextEnd = lastX + txtHeight
            }
            ctx.save()
            ctx.translate(lastX, ty)
            ctx.rotate(dir * Math.PI / 180)
            ctx.fillText(name, 2, 2)
            ctx.restore()
            ctx.fillRect(lastX, my, 1, 8)

            lastX += width
        }

        message.reply({
            content: `Here is my analysis of "${stats.name}" by ${stats.owner}:`,
            files: [card.toBuffer("image/png")],
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
