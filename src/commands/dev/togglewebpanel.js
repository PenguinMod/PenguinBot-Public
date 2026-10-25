const BotState = require("../../util/bot-state.js");
const BaseCommand = require("../../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "togglewebpanel";
        this.description = "Enable or disable the web panel. Provide a boolean if you don't want a toggle.";
        this.attributes = {
            unlisted: true,
            permission: 1,
        };
    }

    invoke(message, args) {
        if (!args[0]) {
            BotState.state.panelForcedDisabled = !BotState.state.panelForcedDisabled;
            message.reply(`Web Panel enabled = ${!BotState.state.panelForcedDisabled}`);
            return;
        }
        BotState.state.panelForcedDisabled = String(args[0]).toLowerCase().trim() !== 'true';
        message.reply(`Web Panel enabled = ${!BotState.state.panelForcedDisabled}`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;