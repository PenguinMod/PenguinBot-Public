/**
 * @fileoverview This module is responsible for creating the "analyze" images from pm!analyze
 * This may be used in browser some day. So avoid using unportable stuff (like sharp unfortunately)
 */
/** */
const axios = require('axios');
const JSZip = require('jszip');

const Canvas = require('skia-canvas');
const { Jimp, JimpMime } = require('jimp');

const PenguinModClient = require("./penguinmod-client");
const SkiaCanvasUtil = require("./canvas-util-skia.js");

const EXTENSION_INFO = require("./penguinmod-analyze-extensions.js");

// core values kinda
const DEFAULT_EXTENSION_COLOR = "#0FBD8C";
const PROP_ENTRY_WIDTH = 160;
const PROP_ENTRY_HEIGHT = 50;
/** Which label corresponds with which property in the collected stats */
const STAT_PROPS = [
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
];
/** Which category IDs are built into PenguinMod */
const CORE_CATEGORIES = [
    'motion',
    'looks',
    'sound',
    'event',
    'control',
    'sensing',
    'operator',
    'variables',
    'lists',
    'procedures', // My Blocks
];
const LAST_LINE_WIDTH = 320 - ((((STAT_PROPS.length - 1) % 4) * PROP_ENTRY_WIDTH) / 2)
const LAST_LINE = Math.floor(STAT_PROPS.length / 4) + 1

const getExtensionIdForOpcode = function (opcode) {
    if (typeof opcode !== 'string') return '';
    const index = opcode.indexOf('_');
    const forbiddenSymbols = /[^\w-]/g;
    const prefix = opcode.substring(0, index).replace(forbiddenSymbols, '-');
    return prefix;
};

class PenguinModAnalyze {
    /**
     * @typedef {Object} PenguinModAnalyzeProjectLoose A loose structure that represents a PenguinMod project. Extends Project also, so can contain those properties.
     * @property {string?} id The ID of the project
     * @property {PenguinModTypes.Project?} project The project structure
     * @property {any?} zip A valid input for JSZip
     * @property {Object?} json The Scratch project.json structure
     */
    /**
     * @typedef {string|PenguinModAnalyzeProjectLoose} PenguinModAnalyzeProject An input for PenguinModAnalyze.
     */

    /** @private internal cache */
    static _cacheStats = {};
    /** @private internal cache */
    static _cacheProject = {};

    /**
     * Resolve a loose PenguinModAnalyzeProject to a project ID.
     * Returns null if no project ID is found.
     * @param {PenguinModAnalyzeProject} project 
     * @returns {string}
     */
    static resolveProjectId(project) {
        if (!project) return null;
        if (typeof project === "string") return project
        return project.project ? project.project.id : project.id;
    }
    /**
     * Resolve a loose PenguinModAnalyzeProject to a Project.
     * Will throw if there's nothing we can do to get a real Project.
     * @param {PenguinModAnalyzeProject} project 
     * @param {boolean?} cache Whether to use cache or not. True by default
     * @returns {Promise<PenguinModTypes.Project>}
     */
    static async resolveProject(project, cache) {
        if (!project) throw new Error("No project to resolve");

        // check if we just passed in a Project
        const isFullProjectData = typeof project === "object" && ((project.id && project.title) || project.project);
        if (isFullProjectData)
            return project.project || project;

        // check if we passed in a string of project id or just {id:string}
        const projectId = this.resolveProjectId(project);
        if (!projectId) throw new Error("No project to resolve");
        if (cache === false)
            return await PenguinModClient.projects.getProjectMeta(projectId);

        const projectMeta = this._cacheProject[projectId] || (await PenguinModClient.projects.getProjectMeta(projectId));
        this._cacheProject[projectId] = projectMeta;
        return projectMeta;
    }
    /**
     * Resolve a loose PenguinModAnalyzeProject to a Scratch project.json structure.
     * Will throw if there's nothing we can do to get a real project.json structure.
     * @param {PenguinModAnalyzeProject} project 
     * @returns {Promise<object>}
     */
    static async resolveProjectJson(project) {
        if (!project) throw new Error("No project to resolve");

        // check if we just passed in a json
        if (project.json)
            return project.json;

        // see if we gave in .zip, and if not, then fetch it
        // NOTE: There's no cache for this because JSON can easily >5mb
        let projectZipInput = project.zip;
        if (!projectZipInput) {
            const projectId = this.resolveProjectId(project);
            if (!projectId) throw new Error("No project to resolve");
            const projectFile = await PenguinModClient.projects.getProjectFile(projectId, false);
            projectZipInput = projectFile;
        }

        // parse the zip for the project.json file
        const zip = await JSZip.loadAsync(projectZipInput);
        const file = zip.file('project.json');
        const fileData = await file.async('string');
        return JSON.parse(fileData);
    }

    /**
     * @typedef {Object} PenguinModAnalyzeStatistics
     * @property {number} blocks Total count of non-shadow blocks
     * @property {Object.<string, number>} blocksUsed Map of category/extension IDs to their usage count
     * @property {number} blocksExtensions Total count of blocks belonging to extensions
     * @property {number} sprites Total number of sprites in the project
     * @property {number} broadcasts Total number of broadcasts defined
     * @property {number} costumes Total number of costumes
     * @property {number} sounds Total number of sounds
     * @property {number} lists Total number of lists
     * @property {number} variables Total number of variables
     * @property {number} comments Total number of block/floating comments
     * @property {number} fonts Total number of custom fonts
     * @property {number} extensions Total number of extensions added in the project
     */
    /**
     * @typedef {Object} PenguinModAnalyzeCalculateStatisticsOptions
     * @property {boolean?} cache Set to false to ignore & not set internal cache
     */
    /**
     * Calculates project statistics based on a Project's project.json values.
     * @param {PenguinModAnalyzeProject} project 
     * @param {PenguinModAnalyzeCalculateStatisticsOptions} options 
     * @returns {PenguinModAnalyzeStatistics}
     */
    static async calculateStatistics(project, options = {}) {
        const projectId = this.resolveProjectId(project);
        if (options.cache !== false && projectId && this._cacheStats[projectId])
            return this._cacheStats[projectId];

        const projectJson = await this.resolveProjectJson(project);
        const categoryIds = [...CORE_CATEGORIES, ...(projectJson.extensions || [])];
        const stats = {
            blocks: 0,
            blocksUsed: {},
            blocksExtensions: 0,
            sprites: projectJson.targets.length,
            broadcasts: 0,
            costumes: 0,
            sounds: 0,
            lists: 0,
            variables: 0,
            comments: 0,
            fonts: projectJson.customFonts?.length || 0,
            extensions: (projectJson.extensions || []).length,
        };

        // calculate the rest of the stats from targets
        for (const sprite of projectJson.targets) {
            // easy stats we can calculate from the sprite
            stats.variables += Object.keys(sprite.variables).length;
            stats.lists += Object.keys(sprite.lists).length;
            stats.broadcasts += Object.keys(sprite.broadcasts).length;
            stats.comments += Object.keys(sprite.comments).length;
            stats.costumes += sprite.costumes.length;
            stats.sounds += sprite.sounds.length;

            // count blocks & extension blocks
            for (const blockId in sprite.blocks) {
                const block = sprite.blocks[blockId];
                if (block.shadow) continue; // dont count shadow blocks like menus
                stats.blocks++;

                let categoryId = getExtensionIdForOpcode(block.opcode);
                if (categoryId === "data") {
                    // likely if the block mentions list, it is actually a list block
                    categoryId = block.opcode.includes('list') ? 'lists' : 'variables';
                } else if (categoryIds.includes(categoryId)) {
                    // this is an extension block
                    stats.blocksExtensions++;
                }

                // add to usage count
                stats.blocksUsed[categoryId] ??= 0;
                stats.blocksUsed[categoryId]++;
            }
        }

        if (options.cache !== false && projectId)
            this._cacheStats[projectId] = stats;
        return stats;
    }
    /**
     * @typedef {Object} PenguinModAnalyzeVisualizeCardOptions
     * @property {boolean?} cache Set to false to ignore & not set internal cache
     * @property {number?} scale Set an image scaling factor. Default is 2
     */
    /**
     * Renders project stats onto a card.
     * @param {PenguinModAnalyzeProject} project 
     * @param {PenguinModAnalyzeVisualizeCardOptions} options 
     * @returns {ArrayBuffer}
     */
    static async visualizeCard(project, options = {}) {
        const projectId = this.resolveProjectId(project);
        if (!projectId) throw new Error("Cannot resolve project");

        const projectMeta = await this.resolveProject(project, options.cache);
        const projectJson = await this.resolveProjectJson(project);
        const projectStatsExisting = options.cache === false ? null : this._cacheStats[projectId];
        /** @type {PenguinModAnalyzeStatistics} */
        const projectStats = projectStatsExisting || (await this.calculateStatistics({
            id: projectId,
            json: projectJson
        }, {
            cache: options.cache
        }));

        // render the card
        const imageScale = options.scale ?? 2;

        // create the background image
        const projectImageUrl = PenguinModClient.projects.getProjectThumbnailURL(projectId);
        const backgroundImage = await Jimp.read(projectImageUrl);
        backgroundImage.opaque();
        backgroundImage.resize({ w: 640, h: 360 }); // we need more space
        backgroundImage.blur(24); // just looks better :idk_man:
        backgroundImage.brightness(0.5); // so we can use white text
        const finalizedBackground = await backgroundImage.getBuffer(JimpMime.png);
        const background = await Canvas.loadImage(finalizedBackground);

        // create the canvas
        const canvas = new Canvas.Canvas(640 * imageScale, 360 * imageScale);
        const ctx = canvas.getContext('2d');
        ctx.scale(imageScale, imageScale);

        // opaque draw the background image
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 640, 360);
        ctx.drawImage(background, 0, 0, 640, 360);

        // draw the headers
        ctx.textAlign = 'center';
        ctx.font = '24px Helvetica Bold';
        ctx.fillStyle = 'white';
        SkiaCanvasUtil.fillText(ctx, projectMeta.title, 320, 45, 600);
        ctx.font = '20px Helvetica Bold';
        ctx.textBaseline = "middle";
        SkiaCanvasUtil.fillText(ctx, 'Blocks Used', 320, 345, 600);

        // draw the labels for each statistic
        for (const idx in STAT_PROPS) {
            const [name, prop] = STAT_PROPS[idx];
            const lx = idx % 4;
            const ly = Math.floor(idx / 4) + 1;
            const cx = (lx * PROP_ENTRY_WIDTH) + (ly === LAST_LINE ? LAST_LINE_WIDTH : 80);
            const cy = (ly * PROP_ENTRY_HEIGHT) + 40;

            // draw the label name
            ctx.font = '16px Helvetica';
            ctx.textBaseline = "alphabetic";
            ctx.fillStyle = "white";
            SkiaCanvasUtil.fillText(ctx, name, cx, cy, 320);

            // draw the value
            const number = projectStats[prop];
            ctx.font = '24px Helvetica Bold';
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#FFDD00";
            SkiaCanvasUtil.fillText(ctx, number, cx, cy + 18, 320);
        }

        // draw le extension garph
        // TODO: Maybe this graph should be its own function but im not sure yet what it would return
        const graphWidth = 500;
        const graphHeight = 80;
        const graphStart = 320 - (graphWidth / 2);
        ctx.textAlign = 'left'
        ctx.fillStyle = "white";
        ctx.font = '8px Helvetica';

        // draw the blockes
        let lastX = graphStart;
        let lastTextEnd = 0;
        let lastColor = '';
        const extensionOrder = [...CORE_CATEGORIES, ...(projectJson.extensions || [])]
            .map(categoryId => [ categoryId, projectJson.extensionURLs?.[categoryId] ]);
        for (const [categoryId, extensionUrl] of extensionOrder) {
            // skip entries with zero width
            const usageCount = projectStats.blocksUsed[categoryId] ?? 0;
            const percent = usageCount / projectStats.blocks;
            const width = percent * graphWidth;
            if (!width) continue;

            // draw graph chunk
            let { name, color, hsv } = EXTENSION_INFO[categoryId] || {};
            if (!name) name = categoryId;
            if (!color) color = DEFAULT_EXTENSION_COLOR;
            if (!hsv) hsv = { "h": 163.10344827586206, "s": 0.9206349206349206, "v": 0.7411764705882353 };

            ctx.fillStyle = color;
            ctx.fillRect(lastX, 230, width, graphHeight);

            // if the colors are the same then add a full length devider
            if (lastColor === color) {
                ctx.fillStyle = 'lightgrey';
                ctx.fillRect(lastX, 230, 0.5, graphHeight);
            } else {
                lastColor = color;
            }
            
            // draw chunk label.
            // 1. Knock the text down if it wont fit in our box.
            // 2. Swap sides if we're going to overlap with another piece of text.
            // 3. Use a nice text & label color if we're drawing on a box, so we dont look weird
            const txtMeasurements = ctx.measureText(name);
            const txtWidth = txtMeasurements.actualBoundingBoxRight;
            const txtHeight = (txtMeasurements.actualBoundingBoxAscent + txtMeasurements.actualBoundingBoxDescent) + 3;
            if (txtWidth < width) {
                // get nice text color
                const distanceToYellow = Math.abs(hsv.h - 60) / 40;
                const textLightness = Math.round(Math.max(Math.min(((distanceToYellow * distanceToYellow) / 2) * hsv.v, 1), 0)) * 100;
                
                // draw the text & make sure that the next text piece wont think its going to collide
                ctx.fillStyle = `hsl(0, 0%, ${textLightness}%)`;
                ctx.textBaseline = "top";
                ctx.fillRect(lastX, 302, 1, 8);
                SkiaCanvasUtil.fillText(ctx, name, lastX + 2, 302, width - 2);
                lastTextEnd = 0;
            } else {
                // swap sides 
                let dir = -45;
                let ty = 226;
                let my = 226;
                if (lastTextEnd < lastX) {
                    dir = 45;
                    ty = 314;
                    my = 308;
                    lastTextEnd = lastX + txtHeight;
                }

                // draw the text off kilter
                ctx.fillStyle = 'white';
                ctx.textBaseline = "middle";
                ctx.save();
                ctx.translate(lastX, ty);
                ctx.rotate(dir * Math.PI / 180);
                SkiaCanvasUtil.fillText(ctx, name, 2, 2);
                ctx.restore();

                // draw the label bit
                ctx.fillRect(lastX, my, 1, 8);
            }

            // move over to the next block
            lastX += width;
        }

        // return ArrayBuffer for web compat
        const buffer = await canvas.toBuffer("image/png");
        const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        return arrayBuffer;
    }
}

module.exports = PenguinModAnalyze;
