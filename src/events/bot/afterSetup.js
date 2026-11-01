const configuration = require("../../config.js");

const env = require("../../util/env-util.js");
const envFill = require("../../util/env-fill.js");
const BotState = require("../../util/bot-state.js");
const FormatTime = require("../../util/format-time.js");
const HostUtility = require("../../util/utility-host.js");
const BotEventEmitter = require("../../util/bot-event-emitter.js");

const BaseBotEvent = require("../../classes/base-bot-event.js");

class BotEvent extends BaseBotEvent {
    constructor() {
        super();
        this.listener = "afterSetup";
        this.once = true;

        this.handler = BotEventEmitter;
    }

    /**
     * Runs when the event is invoked
     * @returns {Promise<any>}
     */
    async invoke() {
        // set our status
        const statusText = this.isInTestMode ? configuration.status.testing : configuration.status.normal;
        this.client.user.setPresence({
            status: "online",
            activities: [{
                name: envFill(statusText),
                type: "PLAYING"
            }]
        });

        // Log to discord with one big message containing all the last runtime's information (incase pm!restart) and any loading errors
        const mainChannel = await this.client.channels.fetch(configuration.channels.botTestingChannel);
        const mainDiscordLog = [];
        mainDiscordLog.push(`Bot has restarted; took ${FormatTime.formatTime(Date.now() - HostUtility.startMilliseconds)} to load.`
            + " " + `Running in \`${HostUtility.launchMode}\` mode${!this.isInTestMode ? "" : "; Certain features will not be enabled"}`);

        // All status information is meaningless if this is the first boot ever
        if (HostUtility.lastState.created) {
            switch (HostUtility.lastState.status) {
                case "active":
                    mainDiscordLog.push(`The bot seemed to restart unexpectedly. This can happen if the host rebooted or you are exiting via terminal.`);
                    break;
                default:
                    mainDiscordLog.push(`The bot last shutdown due to: \`${HostUtility.lastState.status}\``);
                    break;
            }
            mainDiscordLog.push(`- The bot last started <t:${Math.round(HostUtility.lastState.started / 1000)}:R>`,
                `- Information about the last bot state was updated <t:${Math.round(HostUtility.lastState.written / 1000)}:R>`);
        } else {
            mainDiscordLog.push("Hello! 👋 You've got PenguinBot setup for the first time! :)"
                + "\n" + "You can configure my channels in `src/config.js`. I'm sending this log here because this is my `botTestingChannel`."
                + "\n" + "You won't see this specific message again. I'll send future logs here about the last run & boot errors though.");
        }

        if (BotState.afterSetupNote)
            mainDiscordLog.push(`Some setup failed.`, `${BotState.afterSetupNote}`);

        // send our big log to the testing channel
        console.log(mainDiscordLog.join("\n"));
        mainChannel.send({
            content: mainDiscordLog.join("\n").trim().substring(0, 2000),
            allowedMentions: {
                parse: [],
                users: [],
                roles: [],
                repliedUser: false
            }
        });
    }
}

module.exports = BotEvent;
