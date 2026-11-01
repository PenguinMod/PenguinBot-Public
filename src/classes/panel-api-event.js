const BaseBotEvent = require("./base-bot-event.js");

const WebPanel = require("../panel/server.js");

class PanelAPIEvent extends BaseBotEvent {
    constructor() {
        super();
        this.once = false;
        this.handler = WebPanel;

        /**
         * The endpoint after `/api` to listen for. Do not include `/api` in the string.
         * @type {string}
         */
        this.endpoint = "/";
        /**
         * The HTTP request method that must be used for this endpoint.
         * @type {'GET'|'POST'|'PUT'|'DELETE'|'PATCH'|'QUERY'|'HEAD'|'OPTIONS'|'TRACE'|'CONNECT'}
         */
        this.method = "GET";

        // listen for ready to setup
        WebPanel.on("ready", () => {
            this.initialize();
        });
    }

    /**
     * Sets up a listener so we emit this event when the endpoint is accessed.
     */
    initialize() {
        if (!WebPanel.router)
            throw new Error("Panel is not ready");
        console.log("Setting up endpoint", this.endpoint);
        WebPanel.router.all(this.endpoint, async (req, res) => {
            if (req.method !== this.method)
                return res.status(405).send('Method Not Allowed');
            WebPanel.emit(this.listener, req, res);
        });
    }

    /**
     * Runs when the event is invoked
     * @param {import('express').Request} req The Express Request object.
     * @param {import('express').Response} res The Express Response object.
     * @returns {Promise<void>|void}
     */
    async invoke(req, res) {
        res.status(500);
        res.json({ "error": "Not implemented" });
    }
}

module.exports = PanelAPIEvent;
