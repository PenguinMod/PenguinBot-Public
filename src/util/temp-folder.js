const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const tempFolderPath = path.join(__dirname, `../../temp/`);
class TempFolder {
    constructor(name) {
        if (!name) throw new Error("Cannot make temp folder without name");
        const tempDir = path.join(tempFolderPath, `./${name}/`);
        if (!tempDir.startsWith(tempFolderPath)) throw new Error("Temp path leads outside of temp folder");

        /** @private Should only be read with tempFolderInstance.tempDir */
        this._tempDir = tempDir;

        this._destroyed = false;
    }
    get tempDir() {
        return this._tempDir;
    }

    /**
     * Make a unique temporary directory name to handle multiple requests at the same time
     * @param {string?} prefix anything to prepend the folder name with
     * @returns {string}
     */
    static makeTempName(prefix) {
        return `${prefix || "temp"}-${crypto.randomBytes(10).toString("hex")}`;
    }

    async create() {
        if (this._destroyed) throw new Error("TempFolder instance is already dead");

        // mkdir recursive doesnt need to check if exists
        await fs.mkdir(this._tempDir, { recursive: true });
    }
    async destroy() {
        if (!this._tempDir) throw new Error("Invalid tempDir");
        if (!path.isAbsolute(this._tempDir)) throw new Error("Invalid tempDir");
        if (!this._tempDir.startsWith(tempFolderPath)) throw new Error("Temp path leads outside of temp folder");
        if (path.resolve(this._tempDir.toLowerCase()) === path.resolve(tempFolderPath.toLowerCase())) throw new Error("Invalid tempDir");

        // NOTE: Scary! long delay since these folders dont really matter much
        this._destroyed = true;
        await fs.rm(this._tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 1000 });
    }

    async createAndDestroy(callback) {
        await this.create();
        try {
            await callback(this._tempDir);
        } finally {
            // err will still be thrown but we destroy
            await this.destroy();
        }
    }
}

module.exports = TempFolder;