const configuration = require("../../../config.js");

const env = require("../../../util/env-util.js");
const BotState = require("../../../util/bot-state.js");
const HostUtility = require("../../../util/utility-host.js");
const PanelAPIEvent = require("../../../classes/panel-api-event.js");

class EndpointEvent extends PanelAPIEvent {
    constructor() {
        super();
        this.listener = "restart";

        this.endpoint = "/restart";
        this.method = "POST";

        this.restarting = false;
    }

    async triggerRestart() {
        const mainChannel = await BotState.client.channels.fetch(configuration.channels.botTestingChannel);
        await mainChannel.send({ content: "Restart triggered from remote, please wait..." });
        await HostUtility.restart();
    }
    /**
     * Runs when the event is invoked
     * @param {import('express').Request} req The Express Request object.
     * @param {import('express').Response} res The Express Response object.
     * @returns {Promise<void>|void}
     */
    async invoke(req, res) {
        if (this.restarting) {
            res.status(400);
            res.json({ error: "Restarting" });
            return;
        }

        this.restarting = true;
        this.triggerRestart().catch(() => {
            this.restarting = false;
        });

        res.status(200);
        res.json({ success: true });
    }
}

module.exports = EndpointEvent;
