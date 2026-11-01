const fs = require("node:fs/promises");
const path = require("node:path");

const glob = require("glob");

class ResponseHandler {
    /**
     * Loaded rules to response matches.
     * @type {Map<RegExp, typeof import("../classes/base-response.js")>}
     */
    static responses = new Map();
    /**
     * Whether or not all responses have loaded.
     */
    static initialized = false;

    /**
     * Matches a message's content and returns Discord.js MessageOptions for a relevant keyword (if found)
     * @param {string} content Normalized string (lowercase)
     * @returns {import("discord.js").MessageOptions?}
     */
    static matchMessage(content) {
        for (const [regex, ResponseClass] of this.responses) {
            if (regex.test(content)) {
                return ResponseClass.invoke(content);
            }
        }
        return null;
    }
    /**
     * Starts initializing responses and sets initialized. If a response fails to load, it will log but not bubble up.
     * Should only be called once.
     */
    static async initialize() {
        if (this.initialized)
            throw new Error("Already initialized responses");

        const folderFiles = await glob.glob('./src/responses/**');
        const files = folderFiles
            .map(file => `../responses/${file.replace(/\\/g, '/').replace('src/responses/', '')}`)
            .filter(file => file.endsWith('.js'));
        for (const fileName of files) {
            try {
                console.log("Loading response", fileName);
                const imported = await import(fileName);

                /** @type {import("../classes/base-response.js")} */
                const response = imported.default;
                await response.initialize();

                // add the rules to our map
                for (const rule of response.rules) {
                    this.responses.set(rule, response);
                }
            } catch (err) {
                console.warn("Failed to load auto-response:", fileName, ";", err);
            }
        }

        // set the flag
        console.log("ResponseHandler loaded responses");
        this.initialized = true;
    };
}

module.exports = ResponseHandler;
