const discord = require("discord.js");

const configuration = require("../../../config.js");

const env = require("../../../util/env-util.js");
const BotState = require("../../../util/bot-state.js");
const PanelAPIEvent = require("../../../classes/panel-api-event.js");

class EndpointEvent extends PanelAPIEvent {
    constructor() {
        super();
        this.listener = "sendmsg";

        this.endpoint = "/sendmsg";
        this.method = "POST";

        /** @type {import("discord.js").TextChannel?} */
        this.channel = null;
    }

    /**
     * Runs when the event is invoked
     * @param {import('express').Request} req The Express Request object.
     * @param {import('express').Response} res The Express Response object.
     * @returns {Promise<void>|void}
     */
    async invoke(req, res) {
        /** @type {import("discord.js").TextChannel?} */
        const mainChannel = this.channel
            || (await BotState.client.channels.fetch(configuration.channels.botTestingChannel));
        this.channel = mainChannel;

        // send the msg
        mainChannel.send({
            content: String(req.body.text).substring(0, 2000),
            flags: discord.MessageFlags.FLAGS.SUPPRESS_EMBEDS,
            allowedMentions: {
                parse: [],
                users: [],
                roles: [],
            }
        }).then(() => {
            res.status(200);
            res.json({ success: true });
        }).catch((err) => {
            res.status(400);
            res.json({ error: `${err}` });
        });
    }
}

module.exports = EndpointEvent;
