const path = require("path");

const glob = require("glob");
const synchronizeSlashCommands = require('@frostzzone/discord-sync-commands');

const configuration = require("../../config.js");

const env = require("../../util/env-util.js");
const envFill = require("../../util/env-fill.js");
const BotState = require("../../util/bot-state.js");
const FormatTime = require("../../util/format-time.js");
const HostUtility = require("../../util/utility-host.js");
const CommandRegistry = require("../../util/command-registry.js");
const BotEventEmitter = require("../../util/bot-event-emitter.js");
const ReactionMessageUtil = require("../../util/reaction-msg-util.js");

const BaseBotEvent = require("../../classes/base-bot-event.js");

class BotEvent extends BaseBotEvent {
    constructor() {
        super();
        this.listener = "ready";
        this.once = true;
    }

    /**
     * Runs when the event is invoked
     * @returns {Promise<any>}
     */
    async invoke() {
        // log we are online, and then wait for other events to have been imported
        console.log(this.client.user.tag + " is online!");
        await BotEventEmitter.eventsReady();

        // register commands
        let errors = '';
        let failed = false;
        console.log("Reading commands folder");
        const folderFiles = await glob.glob('./src/commands/**');
        const files = folderFiles
            .map(filePath => path.join(__dirname, "../../../", filePath))
            .filter(file => file.endsWith('.js'));
        for (const filePath of files) {
            await CommandRegistry.registerFile(filePath);
            failed = CommandRegistry.errors.size > 0;
        }
        for (const [filePath, err] of CommandRegistry.errors.entries()) {
            errors += `\`\`${filePath}\`\` - ${err?.message || err}\n`;
        }

        // register slash commands
        try {
            await CommandRegistry.updateSlash();
        } catch (err) {
            console.error("Failed to register slash;", err);
            errors += `Failed to register slash - ${err?.message || err}\n`;
            failed = true;
        }

        // leave behind afterSetupNote
        if (failed)
            BotState.afterSetupNote = errors;

        // BotState is initialized
        BotState.initialized = true;
        BotEventEmitter.markReady();
        BotEventEmitter.emit("afterSetup");
    }
}

module.exports = BotEvent;