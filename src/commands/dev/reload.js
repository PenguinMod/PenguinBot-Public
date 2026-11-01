const BotState = require("../../util/bot-state.js");
const HostUtility = require("../../util/utility-host.js");
const CommandRegistry = require("../../util/command-registry.js");

const BaseCommand = require("../../classes/base-command.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "reload";
        this.description = "Reload commands from disk by name";
        this.attributes = {
            unlisted: true,
            permission: 1,
        };
    }

    async invoke(message, args, util) {
        if (BotState.request('preventRuntimeChanges'))
            return message.reply('Variable `PREVENT_UPDATES` is set to true on this host.');

        const updatedCommands = new Set();
        for (const commandName of args) {
            const command = CommandRegistry.commands.get(commandName) || CommandRegistry.alias.get(commandName);
            if (!command) continue;

            // unregister and register the file
            const filePath = CommandRegistry.files.get(command);
            if (!filePath)
                throw new Error(`Missing filePath for ${command.name}`);
            CommandRegistry.unregisterFile(filePath);
            await CommandRegistry.registerFile(filePath);

            // now look at the loaded commands through files and add them to the updated list
            for (const [command, newFilePath] of CommandRegistry.files.entries()) {
                if (newFilePath !== filePath) continue;
                updatedCommands.add(command);
            }
        }

        // try to update slash
        let slashError = null;
        try {
            await CommandRegistry.updateSlash();
        } catch (err) {
            slashError = `Failed to register slash - ${err?.message || err}`;
        }

        const commandNames = [...updatedCommands.values()].map(command => command.name).join(", ");
        message.reply(`Reloaded ${updatedCommands.size} commands: ${commandNames || "*(none)*"}`
            + "\n" + [...CommandRegistry.errors.entries()].map(([filePath, err]) => `- \`\`${filePath}\`\` - ${err?.message || err}`).join('\n'))
            + "\n" + `${slashError || ""}`;
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;