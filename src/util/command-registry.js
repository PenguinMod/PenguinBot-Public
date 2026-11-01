const url = require("node:url");
const path = require("node:path");

const glob = require("glob");
const synchronizeSlashCommands = require('@frostzzone/discord-sync-commands');

const configuration = require("../config.js");

const env = require("./env-util.js");
const BotState = require("./bot-state.js");
const HostUtility = require("./utility-host.js");

class CommandRegistry {
    /**
     * Map of command name to command class
     * @type {Map<string, import("../classes/base-command.js")>}
     */
    static commands = new Map();
    /**
     * Map of alias to command
     * @type {Map<string, import("../classes/base-command.js")>}
     */
    static alias = new Map();
    /**
     * Map of command to slash registry object
     * @type {Map<import("../classes/base-command.js"), object>}
     */
    static slashRegistry = new Map();
    /**
     * Map of command to slash to text invoke conversion function
     * @type {Map<import("../classes/base-command.js"), (...) => boolean>}
     */
    static slashConversion = new Map();
    
    /**
     * Map of command to file path
     * @type {Map<import("../classes/base-command.js"), string>}
     */
    static files = new Map();
    /**
     * Map of file path to error. This map is only filled for errors
     * @type {Map<string, any>}
     */
    static errors = new Map();

    /** @private filePaths that have loaded ever */
    static _hasLoaded = new Set();

    /**
     * Imports a command as a group of commands, ignoring cache and making singular commands into groups.
     * @param {string} filePath 
     * @returns {Promise<Record<string, typeof import("../classes/base-command.js")>>}
     */
    static async import(filePath) {
        // cleear require cache for this file
        filePath = path.resolve(filePath);
        if (require.cache[require.resolve(filePath)]) {
            delete require.cache[require.resolve(filePath)];
        }

        // modules should be treated as objects with commandName:CommandClass pairs if they arent already
        // NOTE: need to use pathToFileURL when resolving filePath
        // NOTE: For await import, url params bypass cache. we should only use the url param if this is NOT the first time we have loaded this file
        const fileUrl = url.pathToFileURL(filePath);
        if (this._hasLoaded.has(filePath)) {
            if (HostUtility.launchMode === "test") {
                console.log("Leaking memory by importing", filePath, "as a brand new import (expected in test mode)");
            } else {
                console.warn("Leaking memory by importing", filePath, "as a brand new import (please restart the bot soon!!!)");
            }

            fileUrl.searchParams.set("t", `${Date.now()}`);
        }

        // import the file
        this._hasLoaded.add(filePath);
        const imported = await import(fileUrl.href);
        let module = imported.default;
        if (module.name) {
            const commandClass = module;
            module = {
                [module.name]: commandClass
            };
        }

        return module;
    }

    /**
     * Removes a command from the bot's registry
     * @param {import("../classes/base-command.js")} command 
     */
    static unregisterCommand(command) {
        if (!this.files.has(command))
            throw new Error("Command is not registered");

        const filePath = this.files.get(command);
        this.files.delete(command);
        this.errors.delete(filePath);

        this.commands.delete(command.name);
        this.slashRegistry.delete(command);
        this.slashConversion.delete(command);
        if (Array.isArray(command.alias)) {
            for (const [aliasName, aliasCommand] of this.alias.entries()) {
                if (aliasCommand !== command) continue;
                this.alias.delete(aliasName);
            }
        }
    }
    /**
     * Registers a command into the bot (does not update the files or errors map!)
     * @param {typeof import("../classes/base-command.js")} commandCtor should work where the function can do "new commandCtor()"
     */
    static registerCommand(commandCtor, filePath) {
        filePath = path.resolve(filePath);
        const command = new commandCtor();
        this.files.set(command, filePath);

        // check that this command name isnt taken by another command or an alias
        if (this.commands.get(command.name))
            throw new Error(`Command name ${command.name} has been taken by existing command`);
        if (this.alias.get(command.name))
            throw new Error(`Command name ${command.name} has been taken by command alias`);

        // register the command
        this.commands.set(command.name, command);
        this.slashConversion.set(command, command.convertSlashCommand || (() => false));
        if (command.slash) {
            // see if a separate slash name was defined & if it conflicts with another command
            if (command.slash.name && this.commands.get(command.slash.name) !== command)
                throw new Error(`Slash Command name ${command.slash.name} has been taken by existing command`);
            if (command.slash.name && this.alias.get(command.slash.name) && this.alias.get(command.slash.name) !== command)
                throw new Error(`Slash Command name ${command.slash.name} has been taken by command alias`);
            if (command.slash.name && [...this.slashRegistry.values()].find(slashRegistry => slashRegistry.name === command.slash.name))
                throw new Error(`Slash Command name ${command.slash.name} has been taken by existing slash command`);
            // if there is no separate slash name/desc, use the command name/desc
            if (!command.slash.name) command.slash.name = command.name;
            if (!command.slash.description) command.slash.description = command.slashDescription || command.description;
            this.slashRegistry.set(command, command.slash);
            console.log('Queued Slash command', command.name);
        }

        // register aliases in this.alias map
        if (Array.isArray(command.alias)) {
            for (const alias of command.alias) {
                // check that this alias isnt taken by an existing command name or an existing alias
                if (this.commands.get(alias))
                    throw new Error(`Alias ${alias} for ${command.name} conflicts with command`);
                if (this.alias.get(alias))
                    throw new Error(`Alias ${alias} for ${command.name} conflicts with alias ${this.alias.get(alias).name}`);
                // register the command
                this.alias.set(alias, command);
                console.log('Aliased', command.name, "as", alias);
            }
        }

        // completed
        console.log('Registered command', command.name);
    }

    /**
     * Removes all commands loaded from a file that was used in the bot's registry
     * @param {string} filePath
     */
    static unregisterFile(filePath) {
        filePath = path.resolve(filePath);
        this.errors.delete(filePath);
        for (const [command, commandFile] of this.files.entries()) {
            if (commandFile !== filePath) continue;
            this.unregisterCommand(command);
        }
    }
    /**
     * Registers all commands in a file. Unregisters commands first to prevent conflicts.
     * 
     * Note that this method will not throw on error, and will instead update the errors list.
     * @param {string} filePath 
     */
    static async registerFile(filePath) {
        filePath = path.resolve(filePath);
        this.unregisterFile(filePath);

        try {
            // register all the commands in this file
            const module = await this.import(filePath);
            for (const commandName in module) {
                const commandClass = module[commandName];
                this.registerCommand(commandClass, filePath);
            }
        } catch (err) {
            // cleanup & set error msg
            this.unregisterFile(filePath);
            console.error('Failed to load', filePath, ';', err);
            this.errors.set(filePath, err);
        }
    }

    /**
     * Updates slash commands with Discord.
     */
    static async updateSlash() {
        const slash = [...this.slashRegistry.values()];
        const results = await synchronizeSlashCommands(BotState.client, slash, { debug: false });
        console.log('Registered slash commands!', results);
    }
}

module.exports = CommandRegistry;
